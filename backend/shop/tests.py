from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APITestCase

from orders.models import Order, OrderItem
from .models import Product, Review, ShareEvent, WishlistItem


class SeedProductsCommandTests(TestCase):
    def test_skip_existing_seeds_missing_products_without_overwriting_existing(self):
        existing_product = Product.objects.create(
            slug='robusta-blend',
            name='Custom product name',
            weight='500g',
            price=25000,
            description='Custom description.',
            details='Custom details.',
            tasting_notes='Custom notes.',
            roast='Dark roast',
            image='https://example.com/custom.jpg',
            image_alt='Custom coffee',
        )
        output = StringIO()

        call_command('seed_products', skip_existing=True, stdout=output)

        existing_product.refresh_from_db()
        self.assertEqual(existing_product.name, 'Custom product name')
        self.assertTrue(Product.objects.filter(slug='single-origin-arabica').exists())
        self.assertEqual(Product.objects.count(), 4)
        self.assertIn('Skipped: robusta-blend', output.getvalue())


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
        self.assertEqual(response.data['results'][0]['id'], self.product.slug)
        self.assertEqual(response.data['results'][0]['price'], '18')
        self.assertIsNone(response.data['results'][0]['wholesale_price'])

    def test_product_api_exposes_admin_configured_wholesale_price(self):
        self.product.wholesale_price = 15
        self.product.save(update_fields=('wholesale_price',))

        response = self.client.get('/api/shop/products/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['wholesale_price'], '15')

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
