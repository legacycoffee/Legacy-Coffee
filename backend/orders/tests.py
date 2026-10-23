from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from accounts.models import Notification
from shop.models import Product

from .models import Order


class OrderApiTests(APITestCase):
    def setUp(self):
        self.product = Product.objects.create(
            slug='arabica',
            name='Arabica',
            weight='1kg',
            price=18000,
            description='Coffee',
            details='Details',
            tasting_notes='Citrus',
            roast='Light roast',
            image='https://example.com/coffee.jpg',
            image_alt='Coffee',
        )
        self.user = get_user_model().objects.create_user(
            username='customer',
            email='account@example.com',
            password='StrongPassword!2026',
        )
        self.payload = {
            'customer_name': 'Coffee Customer',
            'customer_email': 'customer@example.com',
            'customer_phone': '+256700000000',
            'delivery_address': '1 Coffee Road',
            'delivery_city': 'Kampala',
            'delivery_latitude': '0.347600',
            'delivery_longitude': '32.582500',
            'items': [{'product_id': self.product.slug, 'quantity': 2}],
        }

    def test_order_uses_catalog_price_and_creates_reference(self):
        self.client.force_authenticate(self.user)
        response = self.client.post('/api/orders/', self.payload, format='json')
        self.assertEqual(response.status_code, 201)
        order = Order.objects.get()
        self.assertTrue(order.reference.startswith('LC-'))
        self.assertEqual(order.total, Decimal('36000'))
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.customer_email, self.user.email)
        self.assertEqual(str(order.delivery_latitude), '0.347600')
        self.user.refresh_from_db()
        self.assertEqual(self.user.delivery_address, '1 Coffee Road')
        self.assertEqual(self.user.delivery_city, 'Kampala')
        self.assertEqual(str(self.user.location_longitude), '32.582500')
        self.assertEqual(response.data['order_items'][0]['unit_price'], '18000')
        notification = Notification.objects.get(user=self.user)
        self.assertEqual(notification.kind, Notification.Kind.ORDER_SUBMITTED)
        self.assertIn(order.reference, notification.message)
        self.assertEqual(notification.details['reference'], order.reference)
        self.assertEqual(notification.details['customer_name'], 'Coffee Customer')
        self.assertEqual(notification.details['customer_email'], self.user.email)
        self.assertEqual(notification.details['delivery_address'], '1 Coffee Road')
        self.assertEqual(notification.details['delivery_city'], 'Kampala')
        self.assertEqual(notification.details['total'], '36000')
        self.assertEqual(notification.details['items'], [{
            'name': 'Arabica',
            'weight': '1kg',
            'unit_price': '18000',
            'quantity': 2,
            'line_total': '36000',
            'image': 'https://example.com/coffee.jpg',
            'image_alt': 'Coffee',
        }])

    def test_order_status_changes_create_customer_notification(self):
        self.client.force_authenticate(self.user)
        self.client.post('/api/orders/', self.payload, format='json')
        order = Order.objects.get()

        order.status = Order.Status.CONFIRMED
        order.save()
        order.status = Order.Status.FULFILLED
        order.save()

        notifications = list(
            Notification.objects.filter(user=self.user).order_by('created_at')
        )
        self.assertEqual(len(notifications), 3)
        self.assertEqual(
            [notification.title for notification in notifications],
            ['Order submitted', 'Order confirmed', 'Order fulfilled'],
        )
        self.assertTrue(all(
            notification.details['reference'] == order.reference
            and notification.details['items'][0]['image'] == self.product.image
            for notification in notifications
        ))

    def test_order_rejects_invalid_quantity_and_duplicate_products(self):
        self.client.force_authenticate(self.user)
        invalid_quantity = {**self.payload, 'items': [{'product_id': self.product.slug, 'quantity': 100}]}
        duplicate_products = {
            **self.payload,
            'items': [
                {'product_id': self.product.slug, 'quantity': 1},
                {'product_id': self.product.slug, 'quantity': 1},
            ],
        }
        self.assertEqual(self.client.post('/api/orders/', invalid_quantity, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/orders/', duplicate_products, format='json').status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_order_requires_authenticated_user(self):
        response = self.client.post('/api/orders/', self.payload, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(Order.objects.count(), 0)

    def test_my_orders_requires_authentication(self):
        response = self.client.get('/api/orders/mine/')
        self.assertEqual(response.status_code, 401)

    def test_my_orders_returns_only_current_users_orders_with_status_and_items(self):
        self.client.force_authenticate(self.user)
        own_order_response = self.client.post('/api/orders/', self.payload, format='json')
        self.assertEqual(own_order_response.status_code, 201)

        other_user = get_user_model().objects.create_user(
            username='another-customer',
            email='another@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(other_user)
        self.client.post('/api/orders/', {
            **self.payload,
            'customer_name': 'Another Customer',
        }, format='json')

        self.client.force_authenticate(self.user)
        response = self.client.get('/api/orders/mine/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        order = response.data['results'][0]
        self.assertEqual(order['reference'], own_order_response.data['reference'])
        self.assertEqual(order['status'], Order.Status.PENDING)
        self.assertEqual(order['status_label'], 'Pending')
        self.assertEqual(order['items'][0]['product_name'], 'Arabica')
        self.assertEqual(order['items'][0]['quantity'], 2)
        self.assertEqual(order['items'][0]['unit_price'], '18000')
        self.assertEqual(order['items'][0]['product_image'], 'https://example.com/coffee.jpg')
        self.assertEqual(order['items'][0]['product_image_alt'], 'Coffee')
        self.assertEqual(order['customer_name'], 'Coffee Customer')
        self.assertEqual(order['customer_email'], self.user.email)
        self.assertEqual(order['customer_phone'], '+256700000000')
        self.assertEqual(order['delivery_address'], '1 Coffee Road')
        self.assertEqual(order['delivery_city'], 'Kampala')
        self.assertEqual(order['delivery_latitude'], '0.347600')
        self.assertEqual(order['delivery_longitude'], '32.582500')
