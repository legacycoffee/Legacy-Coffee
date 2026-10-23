from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from inquiries.models import Inquiry
from orders.models import Order


class DashboardApiTests(APITestCase):
    def setUp(self):
        self.customer = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.staff = get_user_model().objects.create_user(
            username='staff',
            email='staff@example.com',
            password='StrongPassword!2026',
            is_staff=True,
        )

    def test_dashboard_is_staff_only(self):
        self.assertEqual(self.client.get('/api/dashboard/').status_code, 401)
        self.client.force_authenticate(self.customer)
        self.assertEqual(self.client.get('/api/dashboard/').status_code, 403)
        self.assertEqual(self.client.get('/api/dashboard/orders/').status_code, 403)
        self.assertEqual(self.client.get('/api/dashboard/inquiries/').status_code, 403)

    def test_staff_can_read_summary(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('pending_orders', response.data)
        self.assertIn('product_shares', response.data)

    def test_staff_can_read_order_and_inquiry_inboxes(self):
        order = Order.objects.create(
            customer_name='Coffee Customer',
            customer_email='customer@example.com',
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
            total=18000,
        )
        Inquiry.objects.create(
            kind=Inquiry.Kind.CONTACT,
            name='Inquiry Customer',
            email='inquiry@example.com',
            subject='Coffee question',
            message='Please share more details.',
        )
        self.client.force_authenticate(self.staff)

        orders_response = self.client.get('/api/dashboard/orders/')
        inquiries_response = self.client.get('/api/dashboard/inquiries/')

        self.assertEqual(orders_response.status_code, 200)
        self.assertEqual(orders_response.data['results'][0]['reference'], order.reference)
        self.assertEqual(orders_response.data['results'][0]['customer_phone'], '+256700000000')
        self.assertEqual(inquiries_response.status_code, 200)
        self.assertEqual(inquiries_response.data['results'][0]['kind'], Inquiry.Kind.CONTACT)
        self.assertEqual(inquiries_response.data['results'][0]['message'], 'Please share more details.')
