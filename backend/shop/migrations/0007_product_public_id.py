import uuid

from django.db import migrations, models


def populate_product_public_ids(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    database = schema_editor.connection.alias
    for product in Product.objects.using(database).filter(public_id__isnull=True).iterator():
        Product.objects.using(database).filter(pk=product.pk).update(public_id=uuid.uuid4())


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0006_ensure_coffee_seedlings_product'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='public_id',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.RunPython(
            populate_product_public_ids,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='product',
            name='public_id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
