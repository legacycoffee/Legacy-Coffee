from django.core.management.base import BaseCommand

from shop.models import Product


PRODUCTS = (
    {
        'slug': 'legacy-coffee',
        'name': 'Legacy Coffee',
        'coffee_type': 'ground',
        'weight': '250g',
        'price': 15000,
        'description': 'Made from quality green coffee beans, expertly roasted and ground to bring out a rich flavor, delightful aroma, and satisfying coffee experience.',
        'details': 'Our roasted ground coffee is made from carefully selected green coffee beans that are roasted to develop their rich flavor, inviting aroma, and distinctive color. The roasted beans are then ground into fine or coarse textures to suit different brewing methods, delivering a fresh and enjoyable coffee experience in every cup.',
        'tasting_notes': '',
        'roast': 'Roasted Ground Coffee',
        'image': 'https://res.cloudinary.com/vgko5mna/image/upload/v1794320831/products/legacy-coffee.png',
        'image_alt': 'Legacy Coffee',
    },
    {
        'slug': 'legacy-coffee-500g',
        'name': 'Legacy Coffee',
        'coffee_type': 'ground',
        'weight': '500g',
        'price': 25000,
        'description': 'Made from quality green coffee beans, expertly roasted and ground to bring out a rich flavor, delightful aroma, and satisfying coffee experience.',
        'details': 'Our roasted ground coffee is made from carefully selected green coffee beans that are roasted to develop their rich flavor, inviting aroma, and distinctive color. The roasted beans are then ground into fine or coarse textures to suit different brewing methods, delivering a fresh and enjoyable coffee experience in every cup.',
        'tasting_notes': '',
        'roast': 'Roasted Ground Coffee',
        'image': 'https://res.cloudinary.com/vgko5mna/image/upload/v1794380654/products/legacy-coffee-500g.png',
        'image_alt': 'Legacy Coffee 500g',
    },
    {
        'slug': 'legacy-coffe',
        'name': 'Legacy Coffee',
        'coffee_type': 'ground',
        'weight': '1 Kg',
        'price': 50000,
        'description': 'Made from quality green coffee beans, expertly roasted and ground to bring out a rich flavor, delightful aroma, and satisfying coffee experience.',
        'details': 'Our roasted ground coffee is made from carefully selected green coffee beans that are roasted to develop their rich flavor, inviting aroma, and distinctive color. The roasted beans are then ground into fine or coarse textures to suit different brewing methods, delivering a fresh and enjoyable coffee experience in every cup.',
        'tasting_notes': '',
        'roast': 'Roasted Ground Coffee',
        'image': 'https://res.cloudinary.com/vgko5mna/image/upload/v1794380973/products/legacy-coffe.png',
        'image_alt': 'Legacy Coffee 1 Kg',
    },
)


class Command(BaseCommand):
    help = 'Create or update the starter products from the storefront.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Create missing homepage coffee sizes without changing existing products.',
        )

    def handle(self, *args, **options):
        for product_data in PRODUCTS:
            slug = product_data['slug']
            if options['skip_existing']:
                _, created = Product.objects.get_or_create(slug=slug, defaults=product_data)
                if created:
                    action = 'Created'
                else:
                    action = 'Skipped'
            else:
                _, created = Product.objects.update_or_create(slug=slug, defaults=product_data)
                action = 'Created' if created else 'Updated'
            self.stdout.write(f'{action}: {slug}')
