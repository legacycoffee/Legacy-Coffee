from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from accounts.models import Notification
from accounts.notifications import create_order_notification
from shop.models import Product

from .models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.SlugRelatedField(
        source='product',
        slug_field='slug',
        queryset=Product.objects.filter(is_active=True),
    )
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)

    class Meta:
        model = OrderItem
        fields = ('product_name', 'weight', 'unit_price', 'quantity', 'line_total')


class OrderHistoryItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    product_image = serializers.SerializerMethodField()
    product_image_alt = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            'product_name', 'weight', 'unit_price', 'quantity', 'line_total',
            'product_image', 'product_image_alt',
        )

    def get_product_image(self, item):
        return item.product.image if item.product else None

    def get_product_image_alt(self, item):
        return item.product.image_alt if item.product else item.product_name


class OrderHistorySerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    items = OrderHistoryItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'reference', 'customer_name', 'customer_email', 'customer_phone',
            'status', 'status_label', 'total', 'created_at',
            'delivery_address', 'delivery_city', 'delivery_notes',
            'delivery_latitude', 'delivery_longitude', 'items',
        )


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True, allow_empty=False)
    order_items = OrderItemSerializer(source='items', many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'reference', 'customer_name', 'customer_email', 'customer_phone',
            'delivery_address', 'delivery_city', 'delivery_notes', 'status',
            'delivery_latitude', 'delivery_longitude',
            'total', 'order_items', 'items', 'created_at',
        )
        read_only_fields = ('reference', 'status', 'total', 'order_items', 'created_at')

    def validate_items(self, items):
        product_ids = [entry['product'].pk for entry in items]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError('Each product can only appear once. Combine quantities for duplicate products.')
        return items

    @transaction.atomic
    def create(self, validated_data):
        order_items = validated_data.pop('items')
        user = self.context['request'].user
        validated_data['customer_email'] = user.email
        user.delivery_address = validated_data['delivery_address']
        user.delivery_city = validated_data['delivery_city']
        user.delivery_notes = validated_data.get('delivery_notes', '')
        user.location_latitude = validated_data.get('delivery_latitude')
        user.location_longitude = validated_data.get('delivery_longitude')
        user.save(update_fields=(
            'delivery_address', 'delivery_city', 'delivery_notes',
            'location_latitude', 'location_longitude',
        ))
        order = Order.objects.create(
            user=user,
            **validated_data,
        )
        total = Decimal('0')
        for entry in order_items:
            product = entry['product']
            item = OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                weight=product.weight,
                unit_price=product.price,
                quantity=entry['quantity'],
            )
            total += item.line_total
        order.total = total
        order.save(update_fields=('total', 'updated_at'))
        create_order_notification(
            order,
            kind=Notification.Kind.ORDER_SUBMITTED,
            title='Order submitted',
            message=f'Your order {order.reference} has been received and is pending confirmation.',
        )
        return order
