from django.core.management.base import BaseCommand

from shop.models import Product


PRODUCTS = (
    {
        'slug': 'single-origin-arabica',
        'name': 'Single Origin Arabica',
        'coffee_type': 'arabica',
        'weight': '1kg',
        'price': 50000,
        'description': 'A light roast with bright fruity notes from the Kyenjojo highlands.',
        'details': 'Grown by smallholder farmers in Western Uganda and carefully roasted to highlight its naturally sweet, fruit-forward character.',
        'tasting_notes': 'Citrus, red berries, and honey',
        'roast': 'Light roast',
        'image': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&auto=format&fit=crop&q=85',
        'image_alt': 'Freshly brewed coffee beside coffee beans',
    },
    {
        'slug': 'robusta-blend',
        'name': 'Robusta Blend',
        'coffee_type': 'blend',
        'weight': '500g',
        'price': 25000,
        'description': 'Bold and earthy, with a rich body that is perfect for espresso lovers.',
        'details': 'A full-bodied Ugandan Robusta blend with a deep aroma and a satisfying finish. Delicious as espresso or in milk-based drinks.',
        'tasting_notes': 'Dark chocolate, toasted nuts, and spice',
        'roast': 'Dark roast',
        'image': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=900&auto=format&fit=crop&q=85',
        'image_alt': 'Roasted coffee beans ready to brew',
    },
    {
        'slug': 'premium-export-grade',
        'name': 'Premium Export Grade',
        'coffee_type': 'green',
        'weight': '5kg',
        'price': 80,
        'is_active': False,
        'description': 'Bulk export-quality green beans, sourced directly from farmers.',
        'details': 'Carefully selected green coffee beans from our farmer network. Ideal for roasters and businesses looking for traceable Ugandan coffee.',
        'tasting_notes': 'Green coffee beans, ready for roasting',
        'roast': 'Unroasted',
        'image': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=900&auto=format&fit=crop&q=85',
        'image_alt': 'Coffee beans selected for roasting',
    },
    {
        'slug': 'roasted-ground-coffee',
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
        'slug': 'legacy-coffee-1kg',
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
    {
        'slug': 'coffee-seedlings',
        'name': 'Coffee Seedlings',
        'coffee_type': 'other',
        'weight': '1 seedling',
        'price': 2000,
        'description': 'High quality, nationally approved coffee seedlings to help you maximise your investment in coffee farming.',
        'details': 'These nationally approved varieties are drought and disease resistant. Orders above 1,000 seedlings receive a 5% discount.',
        'tasting_notes': 'N/A',
        'roast': 'N/A',
        'image': 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg',
        'image_alt': 'Coffee farm in Uganda',
    },
)


class Command(BaseCommand):
    help = 'Create or update the starter products from the storefront.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Create missing starter products without changing existing products; keep coffee seedlings active.',
        )

    def handle(self, *args, **options):
        for product_data in PRODUCTS:
            slug = product_data['slug']
            if options['skip_existing']:
                product, created = Product.objects.get_or_create(slug=slug, defaults=product_data)
                if created:
                    action = 'Created'
                elif slug == 'coffee-seedlings' and not product.is_active:
                    product.is_active = True
                    product.save(update_fields=('is_active', 'updated_at'))
                    action = 'Activated'
                else:
                    action = 'Skipped'
            else:
                _, created = Product.objects.update_or_create(slug=slug, defaults=product_data)
                action = 'Created' if created else 'Updated'
            self.stdout.write(f'{action}: {slug}')
