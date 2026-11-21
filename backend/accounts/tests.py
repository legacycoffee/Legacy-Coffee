import hashlib
import json
import os
import re
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command, CommandError
from django.test import SimpleTestCase, TestCase
from django.test import override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from accounts.email import send_order_status_email, send_welcome_email
from accounts.services import upload_profile_photo
from accounts.models import Notification
from orders.models import Order


class InitialAdminCommandTests(TestCase):
    @patch.dict(os.environ, {
        'INITIAL_ADMIN_EMAIL': 'existing-account@example.com',
        'INITIAL_ADMIN_USERNAME': 'initial-admin',
        'INITIAL_ADMIN_PASSWORD': 'VeryStrong!Initial2026',
    })
    def test_promotes_existing_account_to_initial_superuser(self):
        existing_user = get_user_model().objects.create_user(
            username='existing-user',
            email='existing-account@example.com',
            password='OriginalStrong!2026',
        )

        call_command('create_initial_admin')

        existing_user.refresh_from_db()
        self.assertEqual(existing_user.username, 'initial-admin')
        self.assertTrue(existing_user.is_active)
        self.assertTrue(existing_user.is_staff)
        self.assertTrue(existing_user.is_superuser)
        self.assertTrue(existing_user.check_password('VeryStrong!Initial2026'))

    @patch.dict(os.environ, {
        'INITIAL_ADMIN_EMAIL': 'initial-admin@example.com',
        'INITIAL_ADMIN_USERNAME': 'initial-admin',
        'INITIAL_ADMIN_PASSWORD': 'VeryStrong!Initial2026',
    })
    def test_creates_initial_superuser_and_does_not_reset_it_on_restart(self):
        call_command('create_initial_admin')

        admin = get_user_model().objects.get(email='initial-admin@example.com')
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.check_password('VeryStrong!Initial2026'))

        with patch.dict(os.environ, {'INITIAL_ADMIN_PASSWORD': 'DifferentStrong!2026'}):
            call_command('create_initial_admin')

        admin.refresh_from_db()
        self.assertTrue(admin.check_password('VeryStrong!Initial2026'))
        self.assertFalse(admin.check_password('DifferentStrong!2026'))

    @patch.dict(os.environ, {
        'INITIAL_ADMIN_EMAIL': '',
        'INITIAL_ADMIN_USERNAME': '',
        'INITIAL_ADMIN_PASSWORD': '',
    })
    def test_skips_when_initial_admin_variables_are_unset(self):
        call_command('create_initial_admin')
        self.assertFalse(get_user_model().objects.filter(is_superuser=True).exists())

    @patch.dict(os.environ, {
        'INITIAL_ADMIN_EMAIL': 'initial-admin@example.com',
        'INITIAL_ADMIN_USERNAME': '',
        'INITIAL_ADMIN_PASSWORD': 'VeryStrong!Initial2026',
    })
    def test_rejects_partial_initial_admin_configuration(self):
        with self.assertRaises(CommandError):
            call_command('create_initial_admin')


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


class TransactionalEmailTests(SimpleTestCase):
    @override_settings(
        RESEND_API_KEY='re_test_key',
        NEWSLETTER_FROM_EMAIL='Legacy Coffee <noreply@legacycoffee.org>',
    )
    @patch('accounts.email.urlopen')
    def test_welcome_email_uses_resend_configuration(self, urlopen):
        response = urlopen.return_value.__enter__.return_value
        response.status = 200
        user = type('UserStub', (), {
            'pk': 12,
            'email': 'customer@example.com',
            'first_name': 'Coffee',
        })()

        self.assertTrue(send_welcome_email(user))

        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, 'https://api.resend.com/emails')
        self.assertEqual(request.get_header('Authorization'), 'Bearer re_test_key')
        payload = json.loads(request.data)
        self.assertEqual(payload['from'], 'Legacy Coffee <noreply@legacycoffee.org>')
        self.assertEqual(payload['to'], ['customer@example.com'])
        self.assertEqual(payload['subject'], 'Welcome to Legacy Coffee')
        self.assertIn('Hello Coffee', payload['text'])

    @override_settings(
        RESEND_API_KEY='re_test_key',
        NEWSLETTER_FROM_EMAIL='orders@example.com',
    )
    @patch('accounts.email.urlopen')
    def test_order_status_email_sends_to_order_and_registered_addresses_once(self, urlopen):
        response = urlopen.return_value.__enter__.return_value
        response.status = 200
        user = type('UserStub', (), {'email': 'account@example.com'})()
        order = type('OrderStub', (), {
            'customer_email': 'customer@example.com',
            'customer_name': 'Coffee Customer',
            'reference': 'LC-123456789',
            'user_id': 3,
            'user': user,
        })()

        self.assertTrue(send_order_status_email(order, 'Confirmed'))

        self.assertEqual(urlopen.call_count, 2)
        payloads = [
            json.loads(call.args[0].data)
            for call in urlopen.call_args_list
        ]
        self.assertEqual(
            [payload['to'] for payload in payloads],
            [['customer@example.com'], ['account@example.com']],
        )
        self.assertTrue(all(
            payload['subject'] == 'Order LC-123456789: Confirmed'
            and 'Current status: Confirmed.' in payload['text']
            for payload in payloads
        ))

    @override_settings(
        RESEND_API_KEY='re_test_key',
        NEWSLETTER_FROM_EMAIL='orders@example.com',
    )
    @patch('accounts.email.urlopen')
    def test_order_status_email_deduplicates_matching_addresses(self, urlopen):
        response = urlopen.return_value.__enter__.return_value
        response.status = 200
        user = type('UserStub', (), {'email': 'Customer@example.com'})()
        order = type('OrderStub', (), {
            'customer_email': 'customer@example.com',
            'customer_name': 'Coffee Customer',
            'reference': 'LC-123456789',
            'user_id': 3,
            'user': user,
        })()

        self.assertTrue(send_order_status_email(order, 'Fulfilled'))

        payload = json.loads(urlopen.call_args.args[0].data)
        self.assertEqual(payload['to'], ['customer@example.com'])


class AuthenticationApiTests(APITestCase):
    def setUp(self):
        cache.clear()

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-web-client-id')
    @patch('accounts.google_auth.id_token.verify_oauth2_token')
    def test_google_sign_in_creates_customer_and_returns_token(self, verify_token):
        verify_token.return_value = {
            'email': 'new-customer@example.com',
            'email_verified': True,
            'sub': 'google-sub-123',
            'given_name': 'New',
            'family_name': 'Customer',
        }

        with patch('accounts.views.send_welcome_email') as send_welcome_email:
            with self.captureOnCommitCallbacks(execute=True) as callbacks:
                response = self.client.post('/api/auth/google/', {
                    'credential': 'signed-google-id-token',
                })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(callbacks), 1)
        send_welcome_email.assert_called_once()
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'new-customer@example.com')
        self.assertEqual(response.data['user']['first_name'], 'New')
        self.assertEqual(response.data['user']['last_name'], 'Customer')
        user = get_user_model().objects.get(email='new-customer@example.com')
        self.assertEqual(user.google_sub, 'google-sub-123')
        self.assertFalse(user.has_usable_password())
        self.assertEqual(
            set(Notification.objects.filter(user=user).values_list('kind', flat=True)),
            {Notification.Kind.WELCOME, Notification.Kind.SIGN_IN},
        )
        verify_token.assert_called_once()
        self.assertEqual(verify_token.call_args.kwargs['audience'], 'google-web-client-id')

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-web-client-id')
    @patch('accounts.google_auth.id_token.verify_oauth2_token')
    def test_google_sign_in_links_verified_email_to_existing_customer(self, verify_token):
        user = get_user_model().objects.create_user(
            username='existing-customer',
            email='existing-customer@example.com',
            password='StrongPassword!2026',
            first_name='Existing',
        )
        verify_token.return_value = {
            'email': 'existing-customer@example.com',
            'email_verified': True,
            'sub': 'google-sub-456',
            'given_name': 'Google',
            'family_name': 'Customer',
        }

        response = self.client.post('/api/auth/google/', {
            'credential': 'signed-google-id-token',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['id'], str(user.public_id))
        user.refresh_from_db()
        self.assertEqual(user.google_sub, 'google-sub-456')
        self.assertEqual(user.first_name, 'Existing')
        self.assertEqual(user.last_name, 'Customer')
        self.assertTrue(user.check_password('StrongPassword!2026'))

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-web-client-id')
    @patch('accounts.google_auth.id_token.verify_oauth2_token')
    def test_google_sign_in_uses_full_name_when_given_and_family_names_are_missing(self, verify_token):
        verify_token.return_value = {
            'email': 'full-name@example.com',
            'email_verified': True,
            'sub': 'google-sub-full-name',
            'name': 'Coffee Customer',
        }

        response = self.client.post('/api/auth/google/', {
            'credential': 'signed-google-id-token',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['first_name'], 'Coffee')
        self.assertEqual(response.data['user']['last_name'], 'Customer')

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-web-client-id')
    @patch('accounts.google_auth.id_token.verify_oauth2_token')
    def test_google_sign_in_fills_missing_family_name_from_full_name(self, verify_token):
        verify_token.return_value = {
            'email': 'partial-name@example.com',
            'email_verified': True,
            'sub': 'google-sub-partial-name',
            'given_name': 'Coffee',
            'name': 'Coffee Customer',
        }

        response = self.client.post('/api/auth/google/', {
            'credential': 'signed-google-id-token',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['first_name'], 'Coffee')
        self.assertEqual(response.data['user']['last_name'], 'Customer')

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-web-client-id')
    @patch('accounts.google_auth.id_token.verify_oauth2_token')
    def test_google_sign_in_rejects_unverified_email(self, verify_token):
        verify_token.return_value = {
            'email': 'unverified@example.com',
            'email_verified': False,
            'sub': 'google-sub-789',
        }

        response = self.client.post('/api/auth/google/', {
            'credential': 'signed-google-id-token',
        })

        self.assertEqual(response.status_code, 400)
        self.assertFalse(get_user_model().objects.filter(email='unverified@example.com').exists())

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-web-client-id')
    @patch('accounts.google_auth.id_token.verify_oauth2_token')
    def test_google_sign_in_rejects_administrator_account(self, verify_token):
        admin = get_user_model().objects.create_user(
            username='google-admin',
            email='admin@example.com',
            password='StrongPassword!2026',
            is_staff=True,
        )
        verify_token.return_value = {
            'email': 'admin@example.com',
            'email_verified': True,
            'sub': 'google-admin-sub',
        }

        response = self.client.post('/api/auth/google/', {
            'credential': 'signed-google-id-token',
        })

        self.assertEqual(response.status_code, 400)
        admin.refresh_from_db()
        self.assertIsNone(admin.google_sub)
        self.assertFalse(Token.objects.filter(user=admin).exists())

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='')
    @patch('accounts.google_auth.id_token.verify_oauth2_token')
    def test_google_sign_in_requires_server_configuration(self, verify_token):
        response = self.client.post('/api/auth/google/', {
            'credential': 'signed-google-id-token',
        })

        self.assertEqual(response.status_code, 503)
        verify_token.assert_not_called()

    def test_registration_creates_token_and_user(self):
        with patch('accounts.views.send_welcome_email') as send_welcome_email:
            with self.captureOnCommitCallbacks(execute=True) as callbacks:
                response = self.client.post('/api/auth/register/', {
                    'username': 'coffee-customer',
                    'email': 'customer@example.com',
                    'phone': '+256700000001',
                    'password': 'StrongPassword!2026',
                    'confirm_password': 'StrongPassword!2026',
                    'first_name': 'Coffee',
                    'last_name': 'Customer',
                    'delivery_address': '1 Coffee Road',
                    'delivery_city': 'Kampala',
                    'location_latitude': '0.347600',
                    'location_longitude': '32.582500',
                })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(callbacks), 1)
        send_welcome_email.assert_called_once()
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'customer@example.com')
        self.assertEqual(response.data['user']['phone'], '+256700000001')
        self.assertEqual(response.data['user']['first_name'], 'Coffee')
        self.assertEqual(response.data['user']['last_name'], 'Customer')
        self.assertEqual(response.data['user']['id'], str(get_user_model().objects.get(email='customer@example.com').public_id))
        self.assertNotEqual(response.data['user']['id'], get_user_model().objects.get(email='customer@example.com').pk)
        self.assertEqual(response.data['user']['delivery_address'], '1 Coffee Road')
        self.assertEqual(response.data['user']['location_latitude'], '0.347600')
        self.assertTrue(get_user_model().objects.filter(email='customer@example.com').exists())
        user = get_user_model().objects.get(email='customer@example.com')
        self.assertEqual(user.first_name, 'Coffee')
        self.assertEqual(user.last_name, 'Customer')
        self.assertEqual(
            Notification.objects.filter(user__email='customer@example.com').values_list('kind', flat=True).get(),
            Notification.Kind.WELCOME,
        )

    def test_login_and_profile_require_valid_credentials(self):
        user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            phone='+256700000002',
            password='StrongPassword!2026',
        )
        response = self.client.post('/api/auth/login/', {
            'email': user.email,
            'password': 'StrongPassword!2026',
        })
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['user']['is_staff'])
        self.assertEqual(response.data['user']['id'], str(user.public_id))
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        notifications = self.client.get('/api/auth/notifications/')
        self.assertEqual(notifications.status_code, 200)
        self.assertEqual(notifications.data['unread_count'], 1)
        self.assertEqual(notifications.data['results'][0]['kind'], Notification.Kind.SIGN_IN)
        self.assertEqual(notifications.data['results'][0]['details'], {})
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 200)

    def test_registration_without_email_and_login_with_phone(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'phone-customer',
            'phone': '+256700000003',
            'password': 'StrongPassword!2026',
            'confirm_password': 'StrongPassword!2026',
        })

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.data['user']['email'])
        self.assertEqual(response.data['user']['phone'], '+256700000003')

        login_response = self.client.post('/api/auth/login/', {
            'email': '+256700000003',
            'password': 'StrongPassword!2026',
        })
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.data['user']['id'], response.data['user']['id'])

    def test_registration_rejects_mismatched_confirm_password(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'mismatch-customer',
            'phone': '+256700000004',
            'password': 'StrongPassword!2026',
            'confirm_password': 'DifferentPassword!2026',
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('confirm_password', response.data)

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
        self.assertEqual(response.data['user']['id'], str(staff_user.public_id))

    def test_new_admin_must_set_a_new_password_before_receiving_an_auth_token(self):
        admin = get_user_model().objects.create_user(
            username='new-admin',
            email='new-admin@example.com',
            password='TemporaryAdmin!2026',
            is_staff=True,
            must_change_password=True,
        )
        previous_token = Token.objects.create(user=admin)
        login_response = self.client.post('/api/auth/login/', {
            'email': admin.email,
            'password': 'TemporaryAdmin!2026',
        })

        self.assertEqual(login_response.status_code, 403)
        self.assertEqual(login_response.data['code'], 'admin_password_setup_required')
        self.assertNotIn('token', login_response.data)
        self.assertFalse(Token.objects.filter(key=previous_token.key).exists())

        invalid_temporary_password_response = self.client.post('/api/auth/admin-password-setup/', {
            'email': admin.email,
            'temporary_password': 'WrongTemporary!2026',
            'new_password': 'NewSecureAdmin!2027',
            'confirm_password': 'NewSecureAdmin!2027',
        })
        self.assertEqual(invalid_temporary_password_response.status_code, 400)
        admin.refresh_from_db()
        self.assertTrue(admin.must_change_password)

        mismatch_response = self.client.post('/api/auth/admin-password-setup/', {
            'email': admin.email,
            'temporary_password': 'TemporaryAdmin!2026',
            'new_password': 'DifferentAdmin!2027',
            'confirm_password': 'OtherAdmin!2027',
        })
        self.assertEqual(mismatch_response.status_code, 400)
        self.assertIn('confirm_password', mismatch_response.data)

        setup_response = self.client.post('/api/auth/admin-password-setup/', {
            'email': admin.email,
            'temporary_password': 'TemporaryAdmin!2026',
            'new_password': 'NewSecureAdmin!2027',
            'confirm_password': 'NewSecureAdmin!2027',
        })

        self.assertEqual(setup_response.status_code, 200)
        self.assertIn('token', setup_response.data)
        admin.refresh_from_db()
        self.assertFalse(admin.must_change_password)
        self.assertTrue(admin.check_password('NewSecureAdmin!2027'))
        self.assertFalse(admin.check_password('TemporaryAdmin!2026'))

        old_password_login = self.client.post('/api/auth/login/', {
            'email': admin.email,
            'password': 'TemporaryAdmin!2026',
        })
        new_password_login = self.client.post('/api/auth/login/', {
            'email': admin.email,
            'password': 'NewSecureAdmin!2027',
        })
        self.assertEqual(old_password_login.status_code, 400)
        self.assertEqual(new_password_login.status_code, 200)

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
        Notification.objects.create(
            user=user,
            kind=Notification.Kind.ORDER_SUBMITTED,
            title='Order update',
            message='Your order is being processed.',
        )

        self.client.force_authenticate(other_user)
        self.assertEqual(self.client.get('/api/auth/notifications/').data['results'], [])
        self.assertEqual(
            self.client.patch(
                f'/api/auth/notifications/{notification.public_id}/read/',
            ).status_code,
            404,
        )

        self.client.force_authenticate(user)
        listed_notification = next(
            item for item in self.client.get('/api/auth/notifications/').data['results']
            if str(item['public_id']) == str(notification.public_id)
        )
        self.assertNotIn('id', listed_notification)
        self.assertEqual(str(listed_notification['public_id']), str(notification.public_id))
        response = self.client.patch(
            f'/api/auth/notifications/{notification.public_id}/read/',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(str(response.data['public_id']), str(notification.public_id))
        self.assertEqual(response.data['unread_count'], 1)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertEqual(self.client.get('/api/auth/notifications/').data['unread_count'], 1)

    def test_users_can_delete_only_their_own_notifications(self):
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
        self.assertEqual(
            self.client.delete(f'/api/auth/notifications/{notification.public_id}/').status_code,
            404,
        )
        self.assertTrue(Notification.objects.filter(pk=notification.pk).exists())

        self.client.force_authenticate(user)
        response = self.client.delete(f'/api/auth/notifications/{notification.public_id}/')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Notification.objects.filter(pk=notification.pk).exists())

    def test_notifications_require_authentication(self):
        self.assertEqual(self.client.get('/api/auth/notifications/').status_code, 401)
        self.assertEqual(
            self.client.delete('/api/auth/notifications/00000000-0000-0000-0000-000000000000/').status_code,
            401,
        )

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


class AuthenticationThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_authentication_endpoints_use_their_scoped_throttle_rates(self):
        endpoints = (
            ('/api/auth/login/', {'email': 'unknown@example.com', 'password': 'WrongPassword!2026'}, 5),
            ('/api/auth/register/', {}, 3),
            ('/api/auth/admin-password-setup/', {}, 5),
        )

        for url, payload, allowed_requests in endpoints:
            with self.subTest(url=url):
                cache.clear()
                responses = [
                    self.client.post(url, payload, format='json')
                    for _ in range(allowed_requests + 1)
                ]
                self.assertTrue(all(
                    response.status_code != 429
                    for response in responses[:allowed_requests]
                ))
                self.assertEqual(responses[allowed_requests].status_code, 429)
