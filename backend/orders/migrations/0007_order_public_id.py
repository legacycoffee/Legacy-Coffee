import uuid

from django.db import migrations, models


def populate_order_public_ids(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    for order in Order.objects.using(schema_editor.connection.alias).filter(
        public_id__isnull=True,
    ).iterator():
        Order.objects.using(schema_editor.connection.alias).filter(
            pk=order.pk,
        ).update(public_id=uuid.uuid4())


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_order_payment_method'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='public_id',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.RunPython(
            populate_order_public_ids,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='order',
            name='public_id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
