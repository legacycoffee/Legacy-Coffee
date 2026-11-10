from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from accounts.models import Notification


class AdminNotificationDeletionTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.staff = user_model.objects.create_user(
            username='staff',
            email='staff@example.com',
            password='StrongPassword!2026',
            is_staff=True,
        )
        self.customer = user_model.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.other_customer = user_model.objects.create_user(
            username='another-customer',
            email='another@example.com',
            password='StrongPassword!2026',
        )
        self.notifications = [
            Notification.objects.create(
                user=user,
                kind=Notification.Kind.WELCOME,
                title=f'Welcome {index}',
                message='Private notification details.',
                details={'secret': 'not required in the admin manager'},
            )
            for index, user in enumerate((self.customer, self.other_customer), start=1)
        ]
        self.client.force_authenticate(self.staff)

    def test_staff_can_view_notification_recipients_without_private_details(self):
        response = self.client.get('/api/dashboard/notifications/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(
            {item['recipient_email'] for item in response.data['results']},
            {'customer@example.com', 'another@example.com'},
        )
        self.assertNotIn('details', response.data['results'][0])

    def test_staff_can_delete_selected_notifications_and_cannot_clear_all_via_data_api(self):
        response = self.client.delete(
            '/api/dashboard/notifications/',
            {'public_ids': [str(self.notifications[0].public_id)]},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['deleted_count'], 1)
        self.assertEqual(response.data['remaining_count'], 1)
        self.assertFalse(Notification.objects.filter(pk=self.notifications[0].pk).exists())
        self.assertTrue(Notification.objects.filter(pk=self.notifications[1].pk).exists())

        clear_all = self.client.delete(
            '/api/dashboard/data/clear/',
            {'category': 'notifications'},
            format='json',
        )
        self.assertEqual(clear_all.status_code, 400)
        self.assertTrue(Notification.objects.filter(pk=self.notifications[1].pk).exists())

    def test_staff_batch_deletion_is_atomic_and_endpoint_is_staff_only(self):
        response = self.client.delete(
            '/api/dashboard/notifications/',
            {
                'public_ids': [
                    str(self.notifications[0].public_id),
                    '00000000-0000-0000-0000-000000000000',
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(Notification.objects.count(), 2)

        self.client.force_authenticate(self.customer)
        self.assertEqual(self.client.get('/api/dashboard/notifications/').status_code, 403)
        self.assertEqual(
            self.client.delete(
                '/api/dashboard/notifications/',
                {'public_ids': [str(self.notifications[0].public_id)]},
                format='json',
            ).status_code,
            403,
        )
