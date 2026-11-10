from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from accounts.models import Notification


class UserNotificationDeletionTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.other_user = user_model.objects.create_user(
            username='another-customer',
            email='another@example.com',
            password='StrongPassword!2026',
        )
        self.notifications = [
            Notification.objects.create(
                user=self.user,
                kind=Notification.Kind.WELCOME,
                title=f'Welcome {index}',
                message='Welcome to Legacy Coffee.',
            )
            for index in range(2)
        ]
        self.other_notification = Notification.objects.create(
            user=self.other_user,
            kind=Notification.Kind.WELCOME,
            title='Other notification',
            message='This belongs to another account.',
        )
        self.client.force_authenticate(self.user)

    def test_user_can_delete_selected_notifications_and_clear_their_own(self):
        selected = self.client.delete(
            '/api/auth/notifications/',
            {'public_ids': [str(self.notifications[0].public_id)]},
            format='json',
        )

        self.assertEqual(selected.status_code, 200)
        self.assertEqual(selected.data['deleted_count'], 1)
        self.assertFalse(Notification.objects.filter(pk=self.notifications[0].pk).exists())
        self.assertTrue(Notification.objects.filter(pk=self.notifications[1].pk).exists())
        self.assertTrue(Notification.objects.filter(pk=self.other_notification.pk).exists())

        cleared = self.client.delete(
            '/api/auth/notifications/',
            {'all': True},
            format='json',
        )

        self.assertEqual(cleared.status_code, 200)
        self.assertEqual(cleared.data['deleted_count'], 1)
        self.assertFalse(Notification.objects.filter(user=self.user).exists())
        self.assertTrue(Notification.objects.filter(pk=self.other_notification.pk).exists())

    def test_user_bulk_delete_rejects_foreign_or_invalid_selection_without_partial_delete(self):
        foreign_ids = [
            str(self.notifications[0].public_id),
            str(self.other_notification.public_id),
        ]
        response = self.client.delete(
            '/api/auth/notifications/',
            {'public_ids': foreign_ids},
            format='json',
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 2)

        for payload in ({}, {'all': True, 'public_ids': [str(self.notifications[0].public_id)]}):
            invalid = self.client.delete('/api/auth/notifications/', payload, format='json')
            self.assertEqual(invalid.status_code, 400)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 2)

    def test_bulk_delete_requires_authentication_and_rejects_oversized_batches(self):
        self.client.force_authenticate(None)
        self.assertEqual(
            self.client.delete('/api/auth/notifications/', {'all': True}, format='json').status_code,
            401,
        )

        self.client.force_authenticate(self.user)
        response = self.client.delete(
            '/api/auth/notifications/',
            {'public_ids': [str(self.notifications[0].public_id)] * 501},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
