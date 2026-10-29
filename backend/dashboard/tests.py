from datetime import datetime, time, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import Notification
from dashboard.models import AnonymousVisitor
from inquiries.models import Inquiry
from newsletter.models import Subscriber
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
        self.assertEqual(
            self.client.patch('/api/dashboard/orders/LC-TEST/payment/', {'is_paid': True}).status_code,
            403,
        )
        self.assertEqual(self.client.get('/api/dashboard/inquiries/').status_code, 403)
        self.assertEqual(self.client.post('/api/dashboard/inquiries/1/open/').status_code, 403)
        self.assertEqual(self.client.get('/api/dashboard/subscribers/').status_code, 403)
        self.assertEqual(self.client.get('/api/dashboard/users/').status_code, 403)
        self.assertEqual(self.client.get('/api/dashboard/analytics/').status_code, 403)
        self.assertEqual(
            self.client.patch('/api/dashboard/orders/LC-TEST/status/', {'status': 'confirmed'}).status_code,
            403,
        )

    def test_staff_can_read_date_filtered_analytics(self):
        today = timezone.localdate()
        start = today - timedelta(days=2)
        recent_login = timezone.make_aware(datetime.combine(today, time.min))
        get_user_model().objects.filter(pk=self.customer.pk).update(
            date_joined=recent_login,
            last_login=recent_login,
        )
        order_values = (
            (Order.Status.PENDING, 1000),
            (Order.Status.CONFIRMED, 2000),
            (Order.Status.FULFILLED, 3000),
            (Order.Status.CANCELLED, 4000),
        )
        for order_status, total in order_values:
            order = Order.objects.create(
                user=self.customer,
                customer_name='Coffee Customer',
                customer_email=self.customer.email,
                customer_phone='+256700000000',
                delivery_address='1 Coffee Road',
                delivery_city='Kampala',
                total=total,
                status=order_status,
            )
            OrderItem.objects.create(
                order=order,
                product_name='Arabica',
                weight='500g',
                unit_price=total,
                quantity=1,
            )

        self.client.force_authenticate(self.staff)
        response = self.client.get(
            f'/api/dashboard/analytics/?start={start.isoformat()}&end={today.isoformat()}',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Cache-Control'], 'no-store')
        self.assertEqual(response.data['sales']['order_count'], 4)
        self.assertEqual(str(response.data['sales']['non_cancelled_order_value']), '6000')
        self.assertEqual(str(response.data['accounting']['cancelled_order_value']), '4000')
        self.assertEqual(response.data['users']['active_users'], 1)
        self.assertEqual(response.data['users']['new_users'], 1)
        self.assertEqual(len(response.data['sales']['daily']), 3)
        self.assertEqual(response.data['sales']['products'][0]['product_name'], 'Arabica')
        self.assertEqual(
            [row['count'] for row in response.data['sales']['statuses']],
            [1, 1, 1, 1],
        )

    def test_analytics_rejects_invalid_date_ranges(self):
        self.client.force_authenticate(self.staff)

        invalid_date = self.client.get('/api/dashboard/analytics/?start=not-a-date')
        reversed_range = self.client.get('/api/dashboard/analytics/?start=2026-10-10&end=2026-10-01')
        long_range = self.client.get('/api/dashboard/analytics/?start=2024-01-01&end=2026-10-01')

        self.assertEqual(invalid_date.status_code, 400)
        self.assertEqual(reversed_range.status_code, 400)
        self.assertEqual(long_range.status_code, 400)

    def test_new_registration_is_counted_as_active_without_a_login(self):
        today = timezone.localdate()
        start_at = timezone.make_aware(datetime.combine(today, time.min))
        get_user_model().objects.filter(pk=self.customer.pk).update(
            date_joined=start_at - timedelta(days=1),
            last_login=None,
        )
        newly_registered = get_user_model().objects.create_user(
            username='new-customer',
            email='new-customer@example.com',
            password='StrongPassword!2026',
        )
        get_user_model().objects.filter(pk=newly_registered.pk).update(
            date_joined=start_at,
            last_login=None,
        )

        self.client.force_authenticate(self.staff)
        response = self.client.get(
            f'/api/dashboard/analytics/?start={today.isoformat()}&end={today.isoformat()}',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['users']['active_users'], 1)
        self.assertEqual(response.data['users']['new_users'], 1)
        self.assertEqual(response.data['users']['daily'][0]['active_users'], 1)
        self.assertEqual(response.data['users']['daily'][0]['new_users'], 1)

    def test_staff_can_mark_fulfilled_order_paid_and_accounting_includes_it(self):
        order = Order.objects.create(
            user=self.customer,
            customer_name='Coffee Customer',
            customer_email=self.customer.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
            total=3000,
            status=Order.Status.FULFILLED,
        )
        self.client.force_authenticate(self.staff)

        payment_response = self.client.patch(
            f'/api/dashboard/orders/{order.reference}/payment/',
            {'is_paid': True, 'payment_method': Order.PaymentMethod.MOBILE_MONEY},
            format='json',
        )

        self.assertEqual(payment_response.status_code, 200)
        self.assertTrue(payment_response.data['is_paid'])
        self.assertEqual(payment_response.data['payment_method'], Order.PaymentMethod.MOBILE_MONEY)
        self.assertIsNotNone(payment_response.data['paid_at'])
        order.refresh_from_db()
        self.assertEqual(order.paid_by, self.staff)
        self.assertEqual(order.payment_method, Order.PaymentMethod.MOBILE_MONEY)

        today = timezone.localdate()
        analytics_response = self.client.get(
            f'/api/dashboard/analytics/?start={today.isoformat()}&end={today.isoformat()}',
        )
        self.assertEqual(analytics_response.status_code, 200)
        self.assertEqual(analytics_response.data['sales']['paid_order_count'], 1)
        self.assertEqual(str(analytics_response.data['sales']['paid_order_value']), '3000')
        self.assertEqual(analytics_response.data['sales']['daily'][-1]['paid_orders'], 1)
        self.assertEqual(str(analytics_response.data['sales']['daily'][-1]['paid_order_value']), '3000')
        self.assertEqual(analytics_response.data['accounting']['paid_order_count'], 1)
        self.assertEqual(str(analytics_response.data['accounting']['paid_order_value']), '3000')

    def test_only_fulfilled_orders_can_be_marked_paid_and_staff_can_correct_payment_status(self):
        pending_order = Order.objects.create(
            customer_name='Coffee Customer',
            customer_email=self.customer.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
            total=3000,
        )
        fulfilled_order = Order.objects.create(
            customer_name='Coffee Customer',
            customer_email=self.customer.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
            total=3000,
            status=Order.Status.FULFILLED,
            is_paid=True,
            payment_method=Order.PaymentMethod.BANK,
            paid_by=self.staff,
            paid_at=timezone.now(),
        )
        self.client.force_authenticate(self.staff)

        rejected = self.client.patch(
            f'/api/dashboard/orders/{pending_order.reference}/payment/',
            {'is_paid': True, 'payment_method': Order.PaymentMethod.CASH},
            format='json',
        )
        missing_method = self.client.patch(
            f'/api/dashboard/orders/{fulfilled_order.reference}/payment/',
            {'is_paid': True},
            format='json',
        )
        invalid_method = self.client.patch(
            f'/api/dashboard/orders/{fulfilled_order.reference}/payment/',
            {'is_paid': True, 'payment_method': 'cheque'},
            format='json',
        )
        corrected = self.client.patch(
            f'/api/dashboard/orders/{fulfilled_order.reference}/payment/',
            {'is_paid': False},
            format='json',
        )

        self.assertEqual(rejected.status_code, 400)
        self.assertEqual(missing_method.status_code, 400)
        self.assertEqual(invalid_method.status_code, 400)
        self.assertEqual(corrected.status_code, 200)
        self.assertFalse(corrected.data['is_paid'])
        self.assertEqual(corrected.data['payment_method'], '')
        fulfilled_order.refresh_from_db()
        self.assertIsNone(fulfilled_order.paid_at)
        self.assertIsNone(fulfilled_order.paid_by)

    def test_analytics_counts_opted_in_anonymous_visitors_and_excludes_registered(self):
        today = timezone.localdate()
        start = today - timedelta(days=2)
        first_seen = timezone.make_aware(datetime.combine(today, time.min))
        AnonymousVisitor.objects.create(first_seen_at=first_seen)
        AnonymousVisitor.objects.create(first_seen_at=first_seen, is_registered=True)

        self.client.force_authenticate(self.staff)
        response = self.client.get(
            f'/api/dashboard/analytics/?start={start.isoformat()}&end={today.isoformat()}',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['users']['new_visitors'], 1)
        self.assertEqual(response.data['users']['daily'][-1]['new_visitors'], 1)
        self.assertEqual(response.data['users']['active_visitors'], 1)
        self.assertEqual(response.data['users']['daily'][-1]['active_visitors'], 1)

    def test_visitor_tracking_records_consenting_browser_and_excludes_registered_accounts(self):
        visitor_id = '11223344-5566-4788-99aa-bbccddeeff00'
        first_response = self.client.post(
            '/api/dashboard/visitor/',
            {'visitor_id': visitor_id},
            format='json',
        )
        self.assertEqual(first_response.status_code, 204)
        visitor = AnonymousVisitor.objects.get(visitor_id=visitor_id)
        self.assertFalse(visitor.is_registered)

        self.client.force_authenticate(self.customer)
        registered_response = self.client.post(
            '/api/dashboard/visitor/',
            {'visitor_id': visitor_id},
            format='json',
        )
        self.assertEqual(registered_response.status_code, 204)
        visitor.refresh_from_db()
        self.assertTrue(visitor.is_registered)

    def test_staff_can_read_summary(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('pending_orders', response.data)
        self.assertIn('product_shares', response.data)
        self.assertIn('users', response.data)

    def test_staff_can_list_and_search_newsletter_subscribers(self):
        matching = Subscriber.objects.create(email='coffee@example.com')
        Subscriber.objects.create(email='another@example.com', is_active=False)
        self.client.force_authenticate(self.staff)

        response = self.client.get('/api/dashboard/subscribers/?search=coffee')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], matching.id)
        self.assertEqual(response.data['results'][0]['email'], matching.email)
        self.assertTrue(response.data['results'][0]['is_active'])

    def test_staff_inquiry_inbox_includes_farm_and_seedling_reservations(self):
        reservations = (
            {
                'kind': Inquiry.Kind.FARM_RESERVATION,
                'name': 'Farm Customer',
                'email': 'farm@example.com',
                'subject': 'Coffee farm tour reservation',
                'message': 'Package: Individual Package',
            },
            {
                'kind': Inquiry.Kind.SEEDLING_RESERVATION,
                'name': 'Seedling Customer',
                'email': 'seedling@example.com',
                'subject': 'Coffee seedling reservation',
                'message': 'Type: Robusta',
            },
        )
        for reservation in reservations:
            Inquiry.objects.create(**reservation)
        self.client.force_authenticate(self.staff)

        response = self.client.get('/api/dashboard/inquiries/')

        self.assertEqual(response.status_code, 200)
        requests_by_kind = {item['kind']: item for item in response.data['results']}
        self.assertEqual(
            set(requests_by_kind),
            {Inquiry.Kind.FARM_RESERVATION, Inquiry.Kind.SEEDLING_RESERVATION},
        )
        self.assertEqual(
            requests_by_kind[Inquiry.Kind.FARM_RESERVATION]['message'],
            'Package: Individual Package',
        )
        self.assertEqual(
            requests_by_kind[Inquiry.Kind.SEEDLING_RESERVATION]['message'],
            'Type: Robusta',
        )

    def test_staff_can_mark_new_inquiry_opened_and_clear_new_request_counter(self):
        inquiry = Inquiry.objects.create(
            kind=Inquiry.Kind.CONTACT,
            name='Inquiry Customer',
            email='inquiry@example.com',
            subject='Coffee question',
            message='Please share more details.',
        )
        self.client.force_authenticate(self.staff)

        response = self.client.post(f'/api/dashboard/inquiries/{inquiry.pk}/open/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], Inquiry.Status.IN_PROGRESS)
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.status, Inquiry.Status.IN_PROGRESS)
        summary_response = self.client.get('/api/dashboard/')
        self.assertEqual(summary_response.data['new_inquiries'], 0)
        inbox_response = self.client.get('/api/dashboard/inquiries/')
        self.assertEqual(inbox_response.data['results'][0]['id'], inquiry.pk)
        self.assertEqual(inbox_response.data['results'][0]['status'], Inquiry.Status.IN_PROGRESS)

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
            phone='+256700000010',
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
        self.assertEqual(response.data['results'][0]['phone'], '+256700000010')
        self.assertEqual(response.data['results'][0]['order_count'], 1)
        self.assertNotIn('password', response.data['results'][0])
        self.assertEqual(response.data['count'], 1)

        phone_search_response = self.client.get('/api/dashboard/users/?search=256700000010')
        self.assertEqual(phone_search_response.status_code, 200)
        self.assertEqual(phone_search_response.data['count'], 1)
        self.assertEqual(phone_search_response.data['results'][0]['id'], customer_with_name.id)

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
        self.assertTrue(second_admin.must_change_password)

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
