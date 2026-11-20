from importlib import import_module
from io import StringIO
from types import SimpleNamespace

from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.management import call_command
from rest_framework.test import APITestCase

from orders.models import Order, OrderItem
from .models import Product, Review, ShareEvent, WishlistItem


class SeedProductsCommandTests(APITestCase):
    def test_skip_existing_seeds_missing_products_without_overwriting_existing(self):
        existing_product = Product.objects.get(slug='legacy-coffee-500g')
        existing_product.name = 'Custom product name'
        existing_product.save(update_fields=('name',))
        output = StringIO()

        call_command('seed_products', skip_existing=True, stdout=output)

        existing_product.refresh_from_db()
        self.assertEqual(existing_product.name, 'Custom product name')
        self.assertTrue(Product.objects.filter(slug='legacy-coffee').exists())
        self.assertTrue(Product.objects.filter(slug='legacy-coffe').exists())
        self.assertEqual(
            set(Product.objects.filter(is_active=True).values_list('slug', flat=True)),
            {'legacy-coffee', 'legacy-coffee-500g', 'legacy-coffe'},
        )
        self.assertIn('Skipped: legacy-coffee-500g', output.getvalue())

    def test_homepage_products_migration_preserves_ids_and_hides_other_products(self):
        coffee = Product.objects.get(slug='legacy-coffee')
        original_public_id = coffee.public_id
        coffee.name = 'Customized coffee listing'
        coffee.save(update_fields=('name',))
        Product.objects.filter(slug__in=(
            'single-origin-arabica',
            'robusta-blend',
            'coffee-seedlings',
        )).update(is_active=True)
        migration = import_module('shop.migrations.0012_keep_current_homepage_products')
        schema_editor = SimpleNamespace(connection=SimpleNamespace(alias='default'))

        migration.sync_current_homepage_products(apps, schema_editor)

        coffee.refresh_from_db()
        self.assertEqual(coffee.public_id, original_public_id)
        self.assertEqual(coffee.name, 'Legacy Coffee')
        self.assertEqual(coffee.weight, '250g')
        self.assertEqual(coffee.price, 15000)
        self.assertTrue(coffee.is_active)
        self.assertEqual(
            set(Product.objects.filter(is_active=True).values_list('slug', flat=True)),
            {'legacy-coffee', 'legacy-coffee-500g', 'legacy-coffe'},
        )
        self.assertFalse(Product.objects.get(slug='roasted-ground-coffee').is_active)
        self.assertFalse(Product.objects.get(slug='legacy-coffee-1kg').is_active)
        self.assertFalse(Product.objects.get(slug='coffee-seedlings').is_active)
        response = self.client.get('/api/shop/products/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {product['id'] for product in response.data['results']},
            {'legacy-coffee', 'legacy-coffee-500g', 'legacy-coffe'},
        )

    def test_skip_existing_does_not_reactivate_seedlings_or_old_samples(self):
        seedlings = Product.objects.get(slug='coffee-seedlings')
        seedlings.name = 'Custom Seedlings'
        seedlings.is_active = False
        seedlings.save(update_fields=('name', 'is_active'))
        output = StringIO()

        call_command('seed_products', skip_existing=True, stdout=output)

        seedlings.refresh_from_db()
        self.assertFalse(seedlings.is_active)
        self.assertEqual(seedlings.name, 'Custom Seedlings')
        self.assertFalse(Product.objects.filter(slug='single-origin-arabica', is_active=True).exists())
        self.assertFalse(Product.objects.filter(slug='robusta-blend', is_active=True).exists())
        self.assertNotIn('coffee-seedlings', output.getvalue())
        response = self.client.get('/api/shop/products/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {product['id'] for product in response.data['results']},
            {'legacy-coffee', 'legacy-coffee-500g', 'legacy-coffe'},
        )

    def test_homepage_catalog_migration_exposes_only_the_three_current_sizes(self):
        seedlings = Product.objects.get(slug='coffee-seedlings')
        self.assertFalse(seedlings.is_active)
        response = self.client.get('/api/shop/products/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {product['id'] for product in response.data['results']},
            {'legacy-coffee', 'legacy-coffee-500g', 'legacy-coffe'},
        )

    def test_seedlings_data_migration_reactivates_without_overwriting_custom_product(self):
        seedlings = Product.objects.get(slug='coffee-seedlings')
        seedlings.name = 'Custom Seedlings'
        seedlings.price = 2500
        seedlings.is_active = False
        seedlings.save()
        migration = import_module('shop.migrations.0006_ensure_coffee_seedlings_product')

        migration.ensure_seedlings_product(
            apps,
            SimpleNamespace(connection=SimpleNamespace(alias='default')),
        )

        seedlings.refresh_from_db()
        self.assertTrue(seedlings.is_active)
        self.assertEqual(seedlings.name, 'Custom Seedlings')
        self.assertEqual(seedlings.price, 2500)


class ShopApiTests(APITestCase):
    def setUp(self):
        self.product = Product.objects.create(
            slug='single-origin-arabica',
            name='Single Origin Arabica',
            weight='1kg',
            price=18,
            description='Bright fruity coffee.',
            details='Sourced in Western Uganda.',
            tasting_notes='Citrus and honey',
            roast='Light roast',
            image='https://example.com/coffee.jpg',
            image_alt='Coffee',
        )
        self.user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )

    def test_products_are_public_and_use_frontend_id_field(self):
        response = self.client.get('/api/shop/products/')
        self.assertEqual(response.status_code, 200)
        product = next(
            item for item in response.data['results'] if item['id'] == self.product.slug
        )
        self.assertEqual(str(product['public_id']), str(self.product.public_id))
        self.assertEqual(product['price'], '18')
        self.assertIsNone(product['wholesale_price'])
        self.assertNotIn(
            'coffee-seedlings',
            [item['id'] for item in response.data['results']],
        )

    def test_product_catalog_allows_custom_domain_origins(self):
        for origin in (
            'http://legacycoffee.org',
            'https://legacycoffee.org',
            'http://www.legacycoffee.org',
            'https://www.legacycoffee.org',
        ):
            with self.subTest(origin=origin):
                response = self.client.get(
                    '/api/shop/products/',
                    HTTP_ORIGIN=origin,
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    response['Access-Control-Allow-Origin'],
                    origin,
                )

    def test_product_without_price_is_public_with_a_null_price(self):
        self.product.price = None
        self.product.save(update_fields=('price',))

        response = self.client.get('/api/shop/products/')

        self.assertEqual(response.status_code, 200)
        product = next(
            item for item in response.data['results'] if item['id'] == self.product.slug
        )
        self.assertIsNone(product['price'])

    def test_product_api_exposes_admin_configured_wholesale_price(self):
        self.product.wholesale_price = 15
        self.product.save(update_fields=('wholesale_price',))

        response = self.client.get('/api/shop/products/')

        self.assertEqual(response.status_code, 200)
        product = next(
            item for item in response.data['results'] if item['id'] == self.product.slug
        )
        self.assertEqual(product['wholesale_price'], '15')

    def test_review_creation_requires_auth_and_includes_rating(self):
        payload = {'product': self.product.slug, 'rating': 5, 'text': 'Excellent coffee.'}
        self.assertEqual(self.client.post('/api/shop/reviews/', payload).status_code, 401)

        self.create_order(Order.Status.FULFILLED)
        self.client.force_authenticate(self.user)
        response = self.client.post('/api/shop/reviews/', payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Review.objects.get().rating, 5)

    def test_review_requires_fulfilled_order_for_that_product(self):
        self.client.force_authenticate(self.user)
        payload = {'product': self.product.slug, 'rating': 5, 'text': 'Excellent coffee.'}

        order = self.create_order(Order.Status.PENDING)
        for status in (Order.Status.PENDING, Order.Status.CONFIRMED, Order.Status.CANCELLED):
            order.status = status
            order.save(update_fields=('status',))
            response = self.client.post('/api/shop/reviews/', payload)
            self.assertEqual(response.status_code, 400, f'Reviews must be rejected for {status} orders.')
            self.assertEqual(Review.objects.count(), 0)

        order.status = Order.Status.CONFIRMED
        order.save(update_fields=('status',))

        staff = get_user_model().objects.create_user(
            username='shop-admin',
            email='shop-admin@example.com',
            password='StrongPassword!2026',
            is_staff=True,
        )
        self.client.force_authenticate(staff)
        fulfillment_response = self.client.patch(
            f'/api/dashboard/orders/{order.reference}/status/',
            {'status': Order.Status.FULFILLED},
            format='json',
        )
        self.assertEqual(fulfillment_response.status_code, 200)

        self.client.force_authenticate(self.user)
        eligibility_response = self.client.get(
            f'/api/shop/reviews/eligibility/?product={self.product.slug}',
        )
        self.assertTrue(eligibility_response.data['can_review'])
        fulfilled_response = self.client.post('/api/shop/reviews/', payload)
        self.assertEqual(fulfilled_response.status_code, 201)

    def test_another_customers_fulfilled_order_does_not_allow_review(self):
        other_user = get_user_model().objects.create_user(
            username='other-customer',
            email='other@example.com',
            password='StrongPassword!2026',
        )
        self.create_order(Order.Status.FULFILLED)
        self.client.force_authenticate(other_user)
        payload = {'product': self.product.slug, 'rating': 5, 'text': 'Excellent coffee.'}

        response = self.client.post('/api/shop/reviews/', payload)
        eligibility = self.client.get(
            f'/api/shop/reviews/eligibility/?product={self.product.slug}',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(eligibility.data['has_purchased'])
        self.assertFalse(eligibility.data['can_review'])
        self.assertEqual(Review.objects.count(), 0)

    def test_review_eligibility_requires_auth_and_reports_purchase_state(self):
        url = f'/api/shop/reviews/eligibility/?product={self.product.slug}'
        self.assertEqual(self.client.get(url).status_code, 401)
        self.client.force_authenticate(self.user)

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {
            'has_purchased': False,
            'has_reviewed': False,
            'can_review': False,
        })

        self.create_order(Order.Status.FULFILLED)
        response = self.client.get(url)
        self.assertEqual(response.data['can_review'], True)

        Review.objects.create(product=self.product, user=self.user, rating=5, text='Already reviewed.')
        response = self.client.get(url)
        self.assertEqual(response.data['can_review'], False)
        self.assertEqual(response.data['has_reviewed'], True)

    def test_wishlist_is_private_and_deduplicated(self):
        self.assertEqual(self.client.get('/api/shop/wishlist/').status_code, 401)
        self.client.force_authenticate(self.user)
        payload = {'product_id': self.product.slug}
        self.assertEqual(self.client.post('/api/shop/wishlist/', payload).status_code, 201)
        self.assertEqual(self.client.post('/api/shop/wishlist/', payload).status_code, 200)
        self.assertEqual(WishlistItem.objects.count(), 1)
        self.assertEqual(self.client.delete(f'/api/shop/wishlist/{self.product.slug}/').status_code, 204)

    def test_share_event_records_active_product_and_channel_without_identity(self):
        response = self.client.post('/api/shop/share-events/', {
            'product_id': self.product.slug,
            'channel': 'whatsapp',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        event = ShareEvent.objects.get()
        self.assertEqual(event.product, self.product)
        self.assertEqual(event.product_slug, self.product.slug)
        self.assertEqual(event.product_name, self.product.name)
        self.assertEqual(event.channel, ShareEvent.Channel.WHATSAPP)
        self.assertEqual(set(response.data), {'id', 'channel', 'created_at'})

    def test_share_event_rejects_unknown_product_or_channel(self):
        unknown_product = self.client.post('/api/shop/share-events/', {
            'product_id': 'missing-product',
            'channel': 'whatsapp',
        }, format='json')
        unknown_channel = self.client.post('/api/shop/share-events/', {
            'product_id': self.product.slug,
            'channel': 'email',
        }, format='json')

        self.assertEqual(unknown_product.status_code, 400)
        self.assertEqual(unknown_channel.status_code, 400)
        self.assertEqual(ShareEvent.objects.count(), 0)

    def create_order(self, status):
        order = Order.objects.create(
            user=self.user,
            customer_name='Coffee Customer',
            customer_email=self.user.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
            status=status,
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            product_name=self.product.name,
            weight=self.product.weight,
            unit_price=self.product.price,
            quantity=1,
        )
        return order
