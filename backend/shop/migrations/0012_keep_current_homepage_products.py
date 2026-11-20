from django.db import migrations


HOMEPAGE_PRODUCTS = (
    {
        'slug': 'legacy-coffee',
        'name': 'Legacy Coffee',
        'coffee_type': 'ground',
        'weight': '250g',
        'price': 15000,
        'description': (
            'Made from quality green coffee beans, expertly roasted and ground '
            'to bring out a rich flavor, delightful aroma, and satisfying coffee experience.'
        ),
        'details': (
            'Our roasted ground coffee is made from carefully selected green coffee beans '
            'that are roasted to develop their rich flavor, inviting aroma, and distinctive '
            'color. The roasted beans are then ground into fine or coarse textures to suit '
            'different brewing methods, delivering a fresh and enjoyable coffee experience '
            'in every cup.'
        ),
        'tasting_notes': '',
        'roast': 'Roasted Ground Coffee',
        'image': 'https://res.cloudinary.com/vgko5mna/image/upload/v1794320831/products/legacy-coffee.png',
        'image_alt': 'Legacy Coffee',
        'is_active': True,
    },
    {
        'slug': 'legacy-coffee-500g',
        'name': 'Legacy Coffee',
        'coffee_type': 'ground',
        'weight': '500g',
        'price': 25000,
        'description': (
            'Made from quality green coffee beans, expertly roasted and ground '
            'to bring out a rich flavor, delightful aroma, and satisfying coffee experience.'
        ),
        'details': (
            'Our roasted ground coffee is made from carefully selected green coffee beans '
            'that are roasted to develop their rich flavor, inviting aroma, and distinctive '
            'color. The roasted beans are then ground into fine or coarse textures to suit '
            'different brewing methods, delivering a fresh and enjoyable coffee experience '
            'in every cup.'
        ),
        'tasting_notes': '',
        'roast': 'Roasted Ground Coffee',
        'image': 'https://res.cloudinary.com/vgko5mna/image/upload/v1794380654/products/legacy-coffee-500g.png',
        'image_alt': 'Legacy Coffee 500g',
        'is_active': True,
    },
    {
        'slug': 'legacy-coffe',
        'name': 'Legacy Coffee',
        'coffee_type': 'ground',
        'weight': '1 Kg',
        'price': 50000,
        'description': (
            'Made from quality green coffee beans, expertly roasted and ground '
            'to bring out a rich flavor, delightful aroma, and satisfying coffee experience.'
        ),
        'details': (
            'Our roasted ground coffee is made from carefully selected green coffee beans '
            'that are roasted to develop their rich flavor, inviting aroma, and distinctive '
            'color. The roasted beans are then ground into fine or coarse textures to suit '
            'different brewing methods, delivering a fresh and enjoyable coffee experience '
            'in every cup.'
        ),
        'tasting_notes': '',
        'roast': 'Roasted Ground Coffee',
        'image': 'https://res.cloudinary.com/vgko5mna/image/upload/v1794380973/products/legacy-coffe.png',
        'image_alt': 'Legacy Coffee 1 Kg',
        'is_active': True,
    },
)


def sync_current_homepage_products(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    manager = Product.objects.using(schema_editor.connection.alias)
    homepage_slugs = []

    for product_data in HOMEPAGE_PRODUCTS:
        slug = product_data['slug']
        homepage_slugs.append(slug)
        manager.update_or_create(
            slug=slug,
            defaults={key: value for key, value in product_data.items() if key != 'slug'},
        )

    manager.exclude(slug__in=homepage_slugs).update(is_active=False)


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0011_sync_homepage_coffee_products'),
    ]

    operations = [
        migrations.RunPython(sync_current_homepage_products, migrations.RunPython.noop),
    ]
