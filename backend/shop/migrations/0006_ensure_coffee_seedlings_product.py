from django.db import migrations


SEEDLING_PRODUCT = {
    'name': 'Coffee Seedlings',
    'coffee_type': 'other',
    'weight': '1 seedling',
    'price': 2000,
    'description': (
        'High quality, nationally approved coffee seedlings to help you '
        'maximise your investment in coffee farming.'
    ),
    'details': (
        'These nationally approved varieties are drought and disease resistant. '
        'Orders above 1,000 seedlings receive a 5% discount.'
    ),
    'tasting_notes': 'N/A',
    'roast': 'N/A',
    'image': 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg',
    'image_alt': 'Coffee farm in Uganda',
    'is_active': True,
}


def ensure_seedlings_product(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    product, created = Product.objects.using(schema_editor.connection.alias).get_or_create(
        slug='coffee-seedlings',
        defaults=SEEDLING_PRODUCT,
    )
    if not created and not product.is_active:
        Product.objects.using(schema_editor.connection.alias).filter(
            pk=product.pk,
        ).update(is_active=True)


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0005_product_coffee_type'),
    ]

    operations = [
        migrations.RunPython(ensure_seedlings_product, migrations.RunPython.noop),
    ]
