from django.db import migrations


def update_prices(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    Product.objects.filter(slug='premium-export-grade').update(is_active=False)
    prices = {
        'single-origin-arabica': 50000,
        'robusta-blend': 25000,
        'roasted-ground-coffee': 15000,
    }
    for slug, price in prices.items():
        Product.objects.filter(slug=slug).update(price=price)


def restore_prices(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    Product.objects.filter(slug='premium-export-grade').update(is_active=True)
    prices = {
        'single-origin-arabica': 18,
        'robusta-blend': 10,
        'roasted-ground-coffee': 7,
    }
    for slug, price in prices.items():
        Product.objects.filter(slug=slug).update(price=price)


class Migration(migrations.Migration):
    dependencies = [
        ('shop', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(update_prices, restore_prices),
    ]
