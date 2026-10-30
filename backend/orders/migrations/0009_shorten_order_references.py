import secrets
import string

from django.db import migrations, models
import orders.models


def generate_short_reference(existing_references):
    alphabet = string.ascii_uppercase + string.digits
    while True:
        suffix = ''.join(secrets.choice(alphabet) for _ in range(9))
        reference = f'LC-{suffix}'
        if reference not in existing_references:
            existing_references.add(reference)
            return reference


def shorten_order_references(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    Notification = apps.get_model('accounts', 'Notification')
    database = schema_editor.connection.alias
    existing_references = set(
        Order.objects.using(database).values_list('reference', flat=True)
    )

    orders = Order.objects.using(database).all().iterator()
    for order in orders:
        if len(order.reference) <= 12:
            continue

        old_reference = order.reference
        new_reference = generate_short_reference(existing_references)
        order.reference = new_reference
        order.invoice_pdf = None
        order.save(update_fields=('reference', 'invoice_pdf'))

        for notification in Notification.objects.using(database).filter(
            kind__in=('order_submitted', 'order_status'),
        ).iterator():
            details = notification.details if isinstance(notification.details, dict) else {}
            if (
                details.get('public_id') != str(order.public_id)
                and details.get('reference') != old_reference
            ):
                continue

            details = {**details, 'reference': new_reference}
            message = notification.message.replace(old_reference, new_reference)
            notification.details = details
            notification.message = message
            notification.save(update_fields=('details', 'message'))


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_notification_public_id'),
        ('orders', '0008_expand_order_reference'),
    ]

    operations = [
        migrations.RunPython(
            shorten_order_references,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='order',
            name='reference',
            field=models.CharField(
                default=orders.models.generate_order_reference,
                max_length=12,
                unique=True,
            ),
        ),
    ]
