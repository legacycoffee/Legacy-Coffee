from accounts.models import Notification


def order_notification_details(order):
    items = list(order.items.select_related('product').all())
    return {
        'reference': order.reference,
        'customer_name': order.customer_name,
        'business_name': order.business_name,
        'customer_email': order.customer_email,
        'customer_phone': order.customer_phone,
        'status': order.status,
        'total': str(order.total),
        'created_at': order.created_at.isoformat(),
        'delivery_address': order.delivery_address,
        'delivery_city': order.delivery_city,
        'delivery_notes': order.delivery_notes,
        'delivery_latitude': (
            str(order.delivery_latitude) if order.delivery_latitude is not None else None
        ),
        'delivery_longitude': (
            str(order.delivery_longitude) if order.delivery_longitude is not None else None
        ),
        'items': [
            {
                'name': item.product_name,
                'weight': item.weight,
                'unit_price': str(item.unit_price),
                'quantity': item.quantity,
                'is_wholesale': item.is_wholesale,
                'line_total': str(item.line_total),
                'image': item.product.image if item.product else None,
                'image_alt': item.product.image_alt if item.product else item.product_name,
            }
            for item in items
        ],
    }


def create_order_notification(order, *, kind, title, message):
    return Notification.objects.create(
        user=order.user,
        kind=kind,
        title=title,
        message=message,
        details=order_notification_details(order),
    )
