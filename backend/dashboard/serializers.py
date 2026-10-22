from rest_framework import serializers

from inquiries.models import Inquiry
from orders.models import Order


class OrderInboxItemSerializer(serializers.Serializer):
    product_name = serializers.CharField()
    weight = serializers.CharField()
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=0)
    quantity = serializers.IntegerField()
    line_total = serializers.DecimalField(max_digits=14, decimal_places=0)


class OrderInboxSerializer(serializers.ModelSerializer):
    items = OrderInboxItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'reference', 'customer_name', 'customer_email', 'customer_phone',
            'delivery_address', 'delivery_city', 'delivery_notes', 'status',
            'total', 'items', 'created_at',
        )


class InquiryInboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = (
            'id', 'kind', 'name', 'email', 'phone', 'business_name',
            'product', 'quantity', 'subject', 'message', 'status', 'created_at',
        )
