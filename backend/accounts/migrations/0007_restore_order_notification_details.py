from decimal import Decimal

from django.db import migrations


def restore_order_details(apps, schema_editor):
    Notification = apps.get_model('accounts', 'Notification')
    Order = apps.get_model('orders', 'Order')
    OrderItem = apps.get_model('orders', 'OrderItem')
    database = schema_editor.connection.alias

    order_references = set()
    for notification in Notification.objects.using(database).filter(
        kind__in=('order_submitted', 'order_status'),
    ).iterator():
        details = notification.details if isinstance(notification.details, dict) else {}
        reference = details.get('reference')
        if reference:
            order_references.add(reference)

    orders = Order.objects.using(database).filter(reference__in=order_references).prefetch_related('items__product')
    order_by_reference = {order.reference: order for order in orders}

    notifications = Notification.objects.using(database).filter(
        kind__in=('order_submitted', 'order_status'),
    ).iterator()
    for notification in notifications:
        details = notification.details if isinstance(notification.details, dict) else {}
        order = order_by_reference.get(details.get('reference'))
        if order is None:
            continue

        items = list(OrderItem.objects.using(database).filter(order_id=order.pk).select_related('product'))
        notification.details = {
            'reference': order.reference,
            'customer_name': order.customer_name,
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
                    'line_total': str(Decimal(item.unit_price) * item.quantity),
                    'image': item.product.image if item.product_id else None,
                    'image_alt': (
                        item.product.image_alt if item.product_id else item.product_name
                    ),
                }
                for item in items
            ],
        }
        notification.save(update_fields=('details',))


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_order_notification_number_only'),
        ('orders', '0002_order_delivery_latitude_order_delivery_longitude'),
    ]

    operations = [
        migrations.RunPython(restore_order_details, migrations.RunPython.noop),
    ]
