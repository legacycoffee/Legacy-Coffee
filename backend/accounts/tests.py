import hashlib
import json
import re
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.services import upload_profile_photo
from accounts.models import Notification
from orders.models import Order


class CloudinaryUploadTests(SimpleTestCase):
    @override_settings(
        CLOUDINARY_CLOUD_NAME='test-cloud',
        CLOUDINARY_API_KEY='test-key',
        CLOUDINARY_API_SECRET='test-secret',
    )
    @patch('accounts.services.urlopen')
    def test_upload_uses_cloudinary_sha1_signature(self, urlopen):
        response = urlopen.return_value.__enter__.return_value
        response.read.return_value = json.dumps({
            'secure_url': 'https://res.cloudinary.com/test-cloud/image/upload/profile.jpg',
        }).encode()
        photo = SimpleUploadedFile(
            'photo.jpg',
            b'\xff\xd8\xffphoto-data',
            content_type='image/jpeg',
        )

        result = upload_profile_photo(photo, 2)

        self.assertEqual(
            result,
            'https://res.cloudinary.com/test-cloud/image/upload/profile.jpg',
        )
        request = urlopen.call_args.args[0]
        request_body = request.data.decode('latin-1')
        timestamp_match = re.search(
            r'name="timestamp"\r\n\r\n(\d+)',
            request_body,
        )
        self.assertIsNotNone(timestamp_match)
        signature_string = (
            'overwrite=true&public_id=profile-photos/user-2&timestamp='
            f'{timestamp_match.group(1)}test-secret'
        )
        expected_signature = hashlib.sha1(
            signature_string.encode(),
        ).hexdigest()
        self.assertIn(f'name="signature"\r\n\r\n{expected_signature}', request_body)


class AuthenticationApiTests(APITestCase):
    def test_registration_creates_token_and_user(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'coffee-customer',
            'email': 'customer@example.com',
            'password': 'StrongPassword!2026',
            'first_name': 'Coffee',
            'delivery_address': '1 Coffee Road',
            'delivery_city': 'Kampala',
            'location_latitude': '0.347600',
            'location_longitude': '32.582500',
        })

        self.assertEqual(response.status_code, 201)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'customer@example.com')
        self.assertEqual(response.data['user']['delivery_address'], '1 Coffee Road')
        self.assertEqual(response.data['user']['location_latitude'], '0.347600')
        self.assertTrue(get_user_model().objects.filter(email='customer@example.com').exists())
        self.assertEqual(
            Notification.objects.filter(user__email='customer@example.com').values_list('kind', flat=True).get(),
            Notification.Kind.WELCOME,
        )

    def test_login_and_profile_require_valid_credentials(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        response = self.client.post('/api/auth/login/', {
            'email': user.email,
            'password': 'StrongPassword!2026',
        })
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['user']['is_staff'])
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        notifications = self.client.get('/api/auth/notifications/')
        self.assertEqual(notifications.status_code, 200)
        self.assertEqual(notifications.data['unread_count'], 1)
        self.assertEqual(notifications.data['results'][0]['kind'], Notification.Kind.SIGN_IN)
        self.assertEqual(notifications.data['results'][0]['details'], {})
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 200)

    def test_staff_login_identifies_staff_account_for_admin_routing(self):
        staff_user = get_user_model().objects.create_user(
            username='staff',
            email='staff@example.com',
            password='StrongPassword!2026',
            is_staff=True,
        )

        response = self.client.post('/api/auth/login/', {
            'email': staff_user.email,
            'password': 'StrongPassword!2026',
        })

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['user']['is_staff'])

    def test_notifications_are_private_and_opening_one_marks_it_read(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        other_user = get_user_model().objects.create_user(
            username='another-customer',
            email='another@example.com',
            password='StrongPassword!2026',
        )
        notification = Notification.objects.create(
            user=user,
            kind=Notification.Kind.WELCOME,
            title='Welcome',
            message='Welcome to Legacy Coffee.',
        )

        self.client.force_authenticate(other_user)
        self.assertEqual(self.client.get('/api/auth/notifications/').data['results'], [])
        self.assertEqual(
            self.client.patch(f'/api/auth/notifications/{notification.pk}/read/').status_code,
            404,
        )

        self.client.force_authenticate(user)
        response = self.client.patch(f'/api/auth/notifications/{notification.pk}/read/')

        self.assertEqual(response.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertEqual(self.client.get('/api/auth/notifications/').data['unread_count'], 0)

    def test_notifications_require_authentication(self):
        self.assertEqual(self.client.get('/api/auth/notifications/').status_code, 401)

    def test_profile_requires_authentication(self):
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    def test_profile_updates_name_without_changing_login_details(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)

        response = self.client.patch('/api/auth/me/', {
            'first_name': 'Sabira',
            'last_name': 'Coffee',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Sabira')
        self.assertEqual(user.last_name, 'Coffee')
        self.assertEqual(user.email, 'customer@example.com')
        self.assertEqual(user.username, 'customer')

    def test_profile_updates_saved_delivery_location(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)

        response = self.client.patch('/api/auth/me/', {
            'delivery_address': '1 Coffee Road',
            'delivery_city': 'Kampala',
            'delivery_notes': 'Call on arrival',
            'location_latitude': '0.347600',
            'location_longitude': '32.582500',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.delivery_address, '1 Coffee Road')
        self.assertEqual(user.delivery_city, 'Kampala')
        self.assertEqual(user.delivery_notes, 'Call on arrival')
        self.assertEqual(str(user.location_latitude), '0.347600')

    @override_settings(
        CLOUDINARY_CLOUD_NAME='test-cloud',
        CLOUDINARY_API_KEY='test-key',
        CLOUDINARY_API_SECRET='test-secret',
    )
    @patch('accounts.views.upload_profile_photo')
    def test_profile_photo_upload_is_saved_as_cloudinary_url(self, upload_photo):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)
        profile_photo = 'https://res.cloudinary.com/test-cloud/image/upload/profile-photo.jpg'
        upload_photo.return_value = profile_photo

        response = self.client.post(
            '/api/auth/profile-photo/',
            {'photo': SimpleUploadedFile('photo.jpg', b'\xff\xd8\xffphoto-data', content_type='image/jpeg')},
            format='multipart',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['profile_photo'], profile_photo)
        user.refresh_from_db()
        self.assertEqual(user.profile_photo, profile_photo)
        upload_photo.assert_called_once()

    def test_profile_photo_upload_requires_authentication(self):
        response = self.client.post(
            '/api/auth/profile-photo/',
            {'photo': SimpleUploadedFile('photo.jpg', b'\xff\xd8\xffphoto-data', content_type='image/jpeg')},
            format='multipart',
        )

        self.assertEqual(response.status_code, 401)

    @override_settings(
        CLOUDINARY_CLOUD_NAME='test-cloud',
        CLOUDINARY_API_KEY='test-key',
        CLOUDINARY_API_SECRET='test-secret',
    )
    def test_profile_photo_upload_rejects_non_image_data(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)

        response = self.client.post(
            '/api/auth/profile-photo/',
            {'photo': SimpleUploadedFile('photo.jpg', b'not-an-image', content_type='image/jpeg')},
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)

    @override_settings(CLOUDINARY_CLOUD_NAME='', CLOUDINARY_API_KEY='', CLOUDINARY_API_SECRET='')
    def test_profile_photo_upload_reports_missing_cloudinary_configuration(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)

        response = self.client.post(
            '/api/auth/profile-photo/',
            {'photo': SimpleUploadedFile('photo.jpg', b'\xff\xd8\xffphoto-data', content_type='image/jpeg')},
            format='multipart',
        )

        self.assertEqual(response.status_code, 503)

    def test_password_change_requires_current_password_and_matching_valid_new_password(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)
        payload = {
            'current_password': 'StrongPassword!2026',
            'new_password': 'NewStrongPassword!2026',
            'confirm_password': 'NewStrongPassword!2026',
        }

        response = self.client.post('/api/auth/change-password/', payload, format='json')

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password('NewStrongPassword!2026'))

    def test_password_change_rejects_incorrect_current_password(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)

        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'wrong',
            'new_password': 'NewStrongPassword!2026',
            'confirm_password': 'NewStrongPassword!2026',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        user.refresh_from_db()
        self.assertTrue(user.check_password('StrongPassword!2026'))

    def test_current_password_verification(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)

        response = self.client.post('/api/auth/verify-password/', {
            'current_password': 'StrongPassword!2026',
        }, format='json')
        self.assertEqual(response.status_code, 200)

        invalid_response = self.client.post('/api/auth/verify-password/', {
            'current_password': 'wrong',
        }, format='json')
        self.assertEqual(invalid_response.status_code, 400)

    def test_account_deletion_requires_password_and_removes_account(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)

        response = self.client.post('/api/auth/delete-account/', {
            'current_password': 'StrongPassword!2026',
        }, format='json')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(get_user_model().objects.filter(pk=user.pk).exists())

    def test_account_deletion_is_blocked_when_orders_exist(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        Order.objects.create(
            user=user,
            customer_name='Coffee Customer',
            customer_email=user.email,
            customer_phone='+256700000000',
            delivery_address='1 Coffee Road',
            delivery_city='Kampala',
        )
        self.client.force_authenticate(user)

        response = self.client.post('/api/auth/delete-account/', {
            'current_password': 'StrongPassword!2026',
        }, format='json')

        self.assertEqual(response.status_code, 409)
        self.assertTrue(get_user_model().objects.filter(pk=user.pk).exists())

    def test_account_deletion_rejects_incorrect_password(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.client.force_authenticate(user)

        response = self.client.post('/api/auth/delete-account/', {
            'current_password': 'wrong',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertTrue(get_user_model().objects.filter(pk=user.pk).exists())
