from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from accounts.models import Notification
from inquiries.models import Inquiry
from orders.models import Order, OrderItem
from shop.models import Product, Review


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
        self.assertEqual(self.client.get('/api/dashboard/users/').status_code, 403)
        self.assertEqual(
            self.client.patch('/api/dashboard/orders/LC-TEST/status/', {'status': 'confirmed'}).status_code,
            403,
        )

    def test_staff_can_read_summary(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('pending_orders', response.data)
        self.assertIn('product_shares', response.data)
        self.assertIn('users', response.data)

    def test_staff_can_read_order_and_inquiry_inboxes(self):
        product = Product.objects.create(
            slug='arabica',
            name='Arabica',
            weight='500g',
            price=18000,
            description='Coffee',
            details='Details',
            tasting_notes='Citrus',
            roast='Light roast',
            image='https://example.com/arabica.jpg',
            image_alt='Arabica coffee beans',
        )
        order = Order.objects.create(
            customer_name='Coffee Customer',
            business_name='Coffee House',
            customer_email='customer@example.com',
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
            total=18000,
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            weight=product.weight,
            unit_price=product.price,
            quantity=1,
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
        self.assertEqual(orders_response.data['results'][0]['business_name'], 'Coffee House')
        self.assertEqual(
            orders_response.data['results'][0]['items'][0]['product_image'],
            'https://example.com/arabica.jpg',
        )
        self.assertEqual(
            orders_response.data['results'][0]['items'][0]['product_image_alt'],
            'Arabica coffee beans',
        )
        self.assertEqual(inquiries_response.status_code, 200)
        self.assertEqual(inquiries_response.data['results'][0]['kind'], Inquiry.Kind.CONTACT)
        self.assertEqual(inquiries_response.data['results'][0]['message'], 'Please share more details.')

    def test_staff_can_search_customer_users_without_exposing_staff_accounts(self):
        customer_with_name = get_user_model().objects.create_user(
            username='sabira',
            email='sabira@example.com',
            first_name='Sabira',
            last_name='Coffee',
            password='StrongPassword!2026',
        )
        get_user_model().objects.create_user(
            username='sabira-staff',
            email='sabira-staff@example.com',
            password='StrongPassword!2026',
            is_staff=True,
        )
        Order.objects.create(
            user=customer_with_name,
            customer_name='Sabira Coffee',
            customer_email=customer_with_name.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
        )
        self.client.force_authenticate(self.staff)

        response = self.client.get('/api/dashboard/users/?search=sabira')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Sabira Coffee')
        self.assertEqual(response.data['results'][0]['email'], customer_with_name.email)
        self.assertEqual(response.data['results'][0]['order_count'], 1)
        self.assertNotIn('password', response.data['results'][0])
        self.assertEqual(response.data['count'], 1)

    def test_staff_can_create_update_publish_and_delete_products(self):
        payload = {
            'slug': 'new-arabica',
            'name': 'New Arabica',
            'coffee_type': 'arabica',
            'weight': '250g',
            'price': '18000',
            'wholesale_price': '15000',
            'description': 'Bright and sweet coffee.',
            'details': 'Grown in Uganda.',
            'tasting_notes': 'Citrus and honey',
            'roast': 'Light roast',
            'image': 'https://example.com/arabica.jpg',
            'image_alt': 'Arabica coffee beans',
            'is_active': True,
        }
        self.client.force_authenticate(self.staff)

        create_response = self.client.post('/api/dashboard/products/', payload, format='json')
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.data['slug'], payload['slug'])
        self.assertEqual(Product.objects.get(slug=payload['slug']).price, 18000)
        self.assertEqual(
            self.client.get('/api/shop/products/').data['results'][0]['id'],
            payload['slug'],
        )

        update_response = self.client.patch(
            f'/api/dashboard/products/{payload["slug"]}/',
            {'price': '20000', 'is_active': False},
            format='json',
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data['price'], '20000')
        self.assertFalse(update_response.data['is_active'])
        self.assertEqual(
            self.client.patch(
                f'/api/dashboard/products/{payload["slug"]}/',
                {'slug': 'changed-slug'},
                format='json',
            ).status_code,
            400,
        )
        self.assertEqual(self.client.get('/api/shop/products/').data['results'], [])

        delete_response = self.client.delete(f'/api/dashboard/products/{payload["slug"]}/')
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(Product.objects.filter(slug=payload['slug']).exists())

    def test_non_staff_cannot_manage_products_and_reviewed_products_cannot_be_deleted(self):
        product = Product.objects.create(
            slug='reviewed-coffee',
            name='Reviewed Coffee',
            weight='500g',
            price=18000,
            description='Coffee',
            details='Details',
            tasting_notes='Citrus',
            roast='Light roast',
            image='https://example.com/coffee.jpg',
            image_alt='Coffee',
        )
        self.assertEqual(self.client.get('/api/dashboard/products/').status_code, 401)

        self.client.force_authenticate(self.customer)
        self.assertEqual(self.client.get('/api/dashboard/products/').status_code, 403)

        Review.objects.create(product=product, user=self.customer, rating=5, text='Great coffee.')
        self.client.force_authenticate(self.staff)
        response = self.client.delete(f'/api/dashboard/products/{product.slug}/')

        self.assertEqual(response.status_code, 409)
        self.assertIn('cannot be deleted', response.data['detail'])
        self.assertTrue(Product.objects.filter(pk=product.slug).exists())

    @patch('dashboard.serializers.upload_product_image')
    def test_staff_can_upload_product_image_during_product_creation(self, upload_image):
        upload_image.return_value = 'https://res.cloudinary.com/test-cloud/image/upload/products/new-coffee.jpg'
        payload = {
            'slug': 'uploaded-coffee',
            'name': 'Uploaded Coffee',
            'coffee_type': 'arabica',
            'weight': '250g',
            'price': '18000',
            'description': 'Bright and sweet coffee.',
            'details': 'Grown in Uganda.',
            'tasting_notes': 'Citrus and honey',
            'roast': 'Light roast',
            'image_alt': 'Arabica coffee beans',
            'is_active': 'true',
            'image': SimpleUploadedFile(
                'coffee.jpg',
                b'\xff\xd8\xfftest-image',
                content_type='image/jpeg',
            ),
        }
        self.client.force_authenticate(self.staff)

        response = self.client.post('/api/dashboard/products/', payload, format='multipart')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data['image'],
            'https://res.cloudinary.com/test-cloud/image/upload/products/new-coffee.jpg',
        )
        self.assertEqual(response.data['coffee_type'], 'arabica')
        upload_image.assert_called_once()

    def test_staff_can_create_and_delete_admins_but_an_active_admin_must_remain(self):
        self.client.force_authenticate(self.staff)
        create_response = self.client.post('/api/dashboard/admins/', {
            'username': 'second-admin',
            'email': 'second-admin@example.com',
            'password': 'CoffeeAdminPass!2026',
        }, format='json')

        self.assertEqual(create_response.status_code, 201)
        second_admin = get_user_model().objects.get(email='second-admin@example.com')
        self.assertTrue(second_admin.is_staff)
        self.assertFalse(second_admin.is_superuser)

        admins_response = self.client.get('/api/dashboard/admins/')
        self.assertEqual(admins_response.status_code, 200)
        self.assertEqual(admins_response.data['count'], 2)
        self.assertNotIn('password', admins_response.data['results'][0])

        delete_response = self.client.delete(f'/api/dashboard/admins/{second_admin.pk}/')
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(get_user_model().objects.filter(pk=second_admin.pk).exists())

        last_admin_response = self.client.delete(f'/api/dashboard/admins/{self.staff.pk}/')
        self.assertEqual(last_admin_response.status_code, 409)
        self.assertTrue(get_user_model().objects.filter(pk=self.staff.pk).exists())

    def test_customers_cannot_manage_admin_accounts(self):
        self.client.force_authenticate(self.customer)
        self.assertEqual(self.client.get('/api/dashboard/admins/').status_code, 403)
        self.assertEqual(
            self.client.post('/api/dashboard/admins/', {
                'username': 'unauthorized',
                'email': 'unauthorized@example.com',
                'password': 'CoffeeAdminPass!2026',
            }, format='json').status_code,
            403,
        )

    def test_staff_can_confirm_cancel_fulfill_and_reopen_orders(self):
        order = Order.objects.create(
            user=self.customer,
            customer_name='Coffee Customer',
            customer_email=self.customer.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
        )
        self.client.force_authenticate(self.staff)

        confirm_response = self.client.patch(
            f'/api/dashboard/orders/{order.reference}/status/',
            {'status': Order.Status.CONFIRMED},
            format='json',
        )
        self.assertEqual(confirm_response.status_code, 200)
        self.assertEqual(confirm_response.data['status'], Order.Status.CONFIRMED)
        self.assertEqual(
            Notification.objects.filter(
                user=self.customer,
                title='Order confirmed',
            ).count(),
            1,
        )

        fulfill_response = self.client.patch(
            f'/api/dashboard/orders/{order.reference}/status/',
            {'status': Order.Status.FULFILLED},
            format='json',
        )
        self.assertEqual(fulfill_response.status_code, 200)
        self.assertEqual(fulfill_response.data['status'], Order.Status.FULFILLED)

    def test_staff_can_cancel_and_reopen_pending_or_cancelled_order(self):
        order = Order.objects.create(
            user=self.customer,
            customer_name='Coffee Customer',
            customer_email=self.customer.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
        )
        self.client.force_authenticate(self.staff)

        cancel_response = self.client.patch(
            f'/api/dashboard/orders/{order.reference}/status/',
            {'status': Order.Status.CANCELLED},
            format='json',
        )
        self.assertEqual(cancel_response.status_code, 200)
        self.assertEqual(cancel_response.data['status'], Order.Status.CANCELLED)
        self.assertTrue(Notification.objects.filter(user=self.customer, title='Order cancelled').exists())

        reopen_response = self.client.patch(
            f'/api/dashboard/orders/{order.reference}/status/',
            {'status': Order.Status.PENDING},
            format='json',
        )
        self.assertEqual(reopen_response.status_code, 200)
        self.assertEqual(reopen_response.data['status'], Order.Status.PENDING)

    def test_status_update_rejects_invalid_transitions_and_non_staff(self):
        order = Order.objects.create(
            user=self.customer,
            customer_name='Coffee Customer',
            customer_email=self.customer.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
            status=Order.Status.FULFILLED,
        )
        self.client.force_authenticate(self.staff)

        invalid_response = self.client.patch(
            f'/api/dashboard/orders/{order.reference}/status/',
            {'status': Order.Status.CANCELLED},
            format='json',
        )
        self.assertEqual(invalid_response.status_code, 400)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.FULFILLED)

        self.client.force_authenticate(self.customer)
        forbidden_response = self.client.patch(
            f'/api/dashboard/orders/{order.reference}/status/',
            {'status': Order.Status.PENDING},
            format='json',
        )
        self.assertEqual(forbidden_response.status_code, 403)
