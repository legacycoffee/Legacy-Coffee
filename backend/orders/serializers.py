from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from accounts.models import Notification
from accounts.notifications import create_order_notification
from shop.models import Product

from .invoices import build_invoice_pdf
from .models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.SlugRelatedField(
        source='product',
        slug_field='slug',
        queryset=Product.objects.filter(is_active=True),
    )
    quantity = serializers.IntegerField(min_value=1, max_value=32767)
    is_wholesale = serializers.BooleanField(default=False)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)

    class Meta:
        model = OrderItem
        fields = ('product_name', 'weight', 'unit_price', 'quantity', 'is_wholesale', 'line_total')


class OrderHistoryItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    product_image = serializers.SerializerMethodField()
    product_image_alt = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            'product_name', 'weight', 'unit_price', 'quantity', 'is_wholesale', 'line_total',
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
            'public_id', 'reference', 'customer_name', 'business_name', 'customer_email', 'customer_phone',
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
            'public_id', 'reference', 'customer_name', 'business_name', 'customer_email', 'customer_phone',
            'delivery_address', 'delivery_city', 'delivery_notes', 'status',
            'delivery_latitude', 'delivery_longitude',
            'total', 'order_items', 'items', 'created_at',
        )
        read_only_fields = ('reference', 'status', 'total', 'order_items', 'created_at')

    def validate_items(self, items):
        product_ids = [entry['product'].pk for entry in items]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError('Each product can only appear once. Combine quantities for duplicate products.')
        for entry in items:
            maximum_quantity = 32767 if entry['product'].slug == 'coffee-seedlings' else 99
            if entry['quantity'] > maximum_quantity:
                raise serializers.ValidationError(
                    f'{entry["product"].name} quantity cannot exceed {maximum_quantity}.'
                )
        return items

    @transaction.atomic
    def create(self, validated_data):
        order_items = validated_data.pop('items')
        user = self.context['request'].user
        validated_data['customer_email'] = user.email or validated_data['customer_email']
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
                unit_price=(
                    product.wholesale_price
                    if entry['is_wholesale'] and product.wholesale_price is not None
                    else product.price * Decimal('0.95')
                    if product.slug == 'coffee-seedlings' and entry['quantity'] > 1000
                    else product.price
                ),
                quantity=entry['quantity'],
                is_wholesale=entry['is_wholesale'],
            )
            total += item.line_total
        order.total = total
        order.save(update_fields=('total', 'updated_at'))
        order.invoice_pdf = build_invoice_pdf(order)
        order.save(update_fields=('invoice_pdf',))
        create_order_notification(
            order,
            kind=Notification.Kind.ORDER_SUBMITTED,
            title='Order submitted',
            message=f'Order number: {order.reference}',
        )
        return order
