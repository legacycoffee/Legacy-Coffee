import json
from urllib.error import URLError
from unittest.mock import patch

from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Inquiry


class InquiryApiTests(APITestCase):
    def test_contact_inquiry_can_be_submitted(self):
        response = self.client.post('/api/inquiries/', {
            'kind': 'contact',
            'name': 'Coffee Customer',
            'email': 'customer@example.com',
            'subject': 'Question',
            'message': 'I would like more information.',
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Inquiry.objects.get().kind, Inquiry.Kind.CONTACT)

    def test_quote_requires_product_and_quantity(self):
        response = self.client.post('/api/inquiries/', {
            'kind': 'quote',
            'name': 'Coffee Customer',
            'email': 'customer@example.com',
            'message': 'Please send a quote.',
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Inquiry.objects.count(), 0)

    @patch('inquiries.services.urlopen')
    @override_settings(
        RESEND_API_KEY='re_test_key',
        NEWSLETTER_FROM_EMAIL='Legacy Coffee <no-reply@example.com>',
    )
    def test_farm_and_seedling_reservations_are_emailed_to_legacy_coffee(self, urlopen):
        response_context = urlopen.return_value.__enter__.return_value
        response_context.status = 200
        reservations = (
            {
                'kind': 'farm_reservation',
                'name': 'Farm Customer',
                'email': 'farm@example.com',
                'phone': '+256700000001',
                'product': 'Coffee farm educational tour',
                'quantity': '4 visitors',
                'subject': 'Coffee farm tour reservation',
                'message': 'Package: Individual Package',
            },
            {
                'kind': 'seedling_reservation',
                'name': 'Seedling Customer',
                'email': 'seedling@example.com',
                'phone': '+256700000002',
                'product': 'Coffee seedlings',
                'quantity': '1200',
                'subject': 'Coffee seedling reservation',
                'message': 'Type: Robusta',
            },
        )

        for reservation in reservations:
            with self.subTest(kind=reservation['kind']):
                response = self.client.post('/api/inquiries/', reservation)
                self.assertEqual(response.status_code, 201)

        self.assertEqual(Inquiry.objects.count(), 2)
        self.assertEqual(urlopen.call_count, 2)
        for call in urlopen.call_args_list:
            request = call.args[0]
            payload = json.loads(request.data)
            self.assertEqual(request.full_url, 'https://api.resend.com/emails')
            self.assertEqual(request.get_header('Authorization'), 'Bearer re_test_key')
            self.assertEqual(payload['to'], ['info@legacycoffee.org'])
            self.assertIn('reply_to', payload)
            self.assertIn('Request number:', payload['text'])

    @patch('inquiries.services.urlopen')
    @override_settings(RESEND_API_KEY='', NEWSLETTER_FROM_EMAIL='')
    def test_reservation_succeeds_when_email_delivery_is_not_configured(self, urlopen):
        with self.assertLogs('inquiries.services', level='ERROR') as logs:
            response = self.client.post('/api/inquiries/', {
                'kind': 'farm_reservation',
                'name': 'Farm Customer',
                'email': 'customer@example.com',
                'product': 'Coffee farm educational tour',
                'quantity': '2 visitors',
                'message': 'Package: Individual Package',
            })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Inquiry.objects.count(), 1)
        self.assertIn('not configured', logs.output[0])
        urlopen.assert_not_called()

    @patch('inquiries.services.urlopen', side_effect=URLError('Resend unavailable'))
    @override_settings(
        RESEND_API_KEY='re_test_key',
        NEWSLETTER_FROM_EMAIL='Legacy Coffee <no-reply@example.com>',
    )
    def test_reservation_succeeds_and_logs_when_email_delivery_fails(self, _urlopen):
        with self.assertLogs('inquiries.services', level='ERROR') as logs:
            response = self.client.post('/api/inquiries/', {
                'kind': 'seedling_reservation',
                'name': 'Seedling Customer',
                'email': 'customer@example.com',
                'product': 'Coffee seedlings',
                'quantity': '1200',
                'message': 'Type: Robusta',
            })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Inquiry.objects.count(), 1)
        self.assertIn('Email delivery failed', logs.output[0])
