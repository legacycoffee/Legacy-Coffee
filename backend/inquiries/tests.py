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

    def test_seedling_reservation_is_saved_for_staff_tracking(self):
        response = self.client.post('/api/inquiries/', {
            'kind': 'seedling_reservation',
            'name': 'Seedling Customer',
            'email': 'customer@example.com',
            'phone': '+256700000000',
            'product': 'Coffee seedlings',
            'quantity': '1200',
            'subject': 'Coffee seedling reservation',
            'message': 'Requested quantity: 1200 seedlings',
        })

        self.assertEqual(response.status_code, 201)
        inquiry = Inquiry.objects.get()
        self.assertEqual(inquiry.kind, Inquiry.Kind.SEEDLING_RESERVATION)
        self.assertEqual(inquiry.quantity, '1200')

    def test_farm_setup_reservation_is_saved_for_staff_tracking(self):
        response = self.client.post('/api/inquiries/', {
            'kind': 'farm_setup',
            'name': 'Farm Customer',
            'email': 'farmer@example.com',
            'phone': '+256700000000',
            'product': 'Coffee farm setup - Starter Package',
            'quantity': '2 acre(s)',
            'subject': 'Coffee farm setup reservation - Starter Package',
            'message': 'Farm size: 2 acre(s)',
        })

        self.assertEqual(response.status_code, 201)
        inquiry = Inquiry.objects.get()
        self.assertEqual(inquiry.kind, Inquiry.Kind.FARM_SETUP)
        self.assertEqual(inquiry.quantity, '2 acre(s)')
