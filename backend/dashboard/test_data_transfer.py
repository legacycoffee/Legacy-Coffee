import json
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from dashboard.models import AnonymousVisitor
from inquiries.models import Inquiry
from newsletter.models import Newsletter, Subscriber
from shop.models import Product, ShareEvent


class DataTransferApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.customer = user_model.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )
        self.staff = user_model.objects.create_user(
            username='staff',
            email='staff@example.com',
            password='StrongPassword!2026',
            is_staff=True,
        )
        self.client.force_authenticate(self.staff)

    def upload_json(self, category, records):
        bundle = {'format_version': 1, 'category': category, 'records': records}
        return SimpleUploadedFile(f'{category}.json', json.dumps(bundle).encode())

    def test_staff_can_export_and_import_products_as_json_csv_and_xml(self):
        formats = (
            ('json', 'application/json'),
            ('csv', 'text/csv'),
            ('xml', 'application/xml'),
        )

        Product.objects.all().delete()
        for file_format, content_type in formats:
            Product.objects.all().delete()
            Product.objects.create(
                slug=f'transfer-{file_format}',
                name='Transfer Coffee',
                coffee_type=Product.CoffeeType.ARABICA,
                weight='250g',
                price=18000,
                description='Description',
                details='Details',
                tasting_notes='Citrus',
                roast='Light roast',
                image='https://images.example.com/coffee.jpg',
                image_alt='Coffee',
            )
            export_response = self.client.get(
                f'/api/dashboard/data/transfer/?category=products&file_format={file_format}',
            )

            self.assertEqual(export_response.status_code, 200, export_response.content)
            self.assertIn(content_type, export_response['Content-Type'])
            if file_format == 'json':
                exported = json.loads(export_response.content)
                self.assertNotIn('image', exported['records'][0])
                self.assertNotIn('images.example.com', export_response.content.decode())

            Product.objects.all().delete()
            import_response = self.client.post(
                '/api/dashboard/data/transfer/',
                {
                    'category': 'products',
                    'file': SimpleUploadedFile(
                        f'products.{file_format}',
                        export_response.content,
                        content_type=content_type,
                    ),
                },
                format='multipart',
            )

            self.assertEqual(import_response.status_code, 201, import_response.content)
            self.assertEqual(import_response.data['imported_count'], 1)
            self.assertEqual(Product.objects.get(slug=f'transfer-{file_format}').image, '')

    def test_import_is_add_only_and_atomic_when_file_contains_duplicate(self):
        Product.objects.create(
            slug='already-here',
            name='Existing Coffee',
            coffee_type=Product.CoffeeType.ARABICA,
            weight='250g',
            price=18000,
            description='Description',
            details='Details',
            roast='Light roast',
        )
        records = [
            {
                'record_type': 'product',
                'slug': 'new-coffee',
                'name': 'New Coffee',
                'coffee_type': 'arabica',
                'weight': '250g',
                'price': '18000',
                'description': 'Description',
                'details': 'Details',
                'roast': 'Light roast',
            },
            {
                'record_type': 'product',
                'slug': 'already-here',
                'name': 'Duplicate Coffee',
                'coffee_type': 'arabica',
                'weight': '250g',
                'price': '18000',
                'description': 'Description',
                'details': 'Details',
                'roast': 'Light roast',
            },
        ]

        response = self.client.post(
            '/api/dashboard/data/transfer/',
            {'category': 'products', 'file': self.upload_json('products', records)},
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Product.objects.filter(slug='new-coffee').exists())

    def test_import_supports_business_categories_and_newsletters_remain_drafts(self):
        self.client.force_authenticate(self.customer)
        self.assertEqual(
            self.client.post(
                '/api/dashboard/data/transfer/',
                {'category': 'newsletters', 'file': self.upload_json('newsletters', [])},
                format='multipart',
            ).status_code,
            403,
        )
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            '/api/dashboard/data/transfer/',
            {
                'category': 'newsletters',
                'file': self.upload_json('newsletters', [
                    {
                        'record_type': 'newsletter',
                        'subject': 'Imported campaign',
                        'content_html': '<p>Draft content</p>',
                        'status': 'sent',
                    },
                    {'record_type': 'subscriber', 'email': 'imported@example.com'},
                ]),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Newsletter.objects.get().status, Newsletter.Status.DRAFT)
        self.assertTrue(Subscriber.objects.filter(email='imported@example.com').exists())

        requests_response = self.client.post(
            '/api/dashboard/data/transfer/',
            {
                'category': 'requests',
                'file': self.upload_json('requests', [{
                    'record_type': 'inquiry',
                    'kind': Inquiry.Kind.CONTACT,
                    'name': 'Imported Customer',
                    'email': 'imported-customer@example.com',
                    'message': 'Imported request',
                }]),
            },
            format='multipart',
        )
        self.assertEqual(requests_response.status_code, 201, requests_response.content)
        self.assertTrue(Inquiry.objects.filter(email='imported-customer@example.com').exists())

        analytics_response = self.client.post(
            '/api/dashboard/data/transfer/',
            {
                'category': 'analytics',
                'file': self.upload_json('analytics', [
                    {
                        'record_type': 'visitor',
                        'visitor_id': str(uuid4()),
                        'is_registered': False,
                    },
                    {
                        'record_type': 'product_share',
                        'product_slug': 'imported-coffee',
                        'product_name': 'Imported Coffee',
                        'channel': ShareEvent.Channel.WHATSAPP,
                    },
                ]),
            },
            format='multipart',
        )
        self.assertEqual(analytics_response.status_code, 201)
        self.assertEqual(AnonymousVisitor.objects.count(), 1)
        self.assertEqual(ShareEvent.objects.count(), 1)

    def test_import_and_export_require_staff(self):
        self.client.force_authenticate(None)
        self.assertEqual(
            self.client.get('/api/dashboard/data/transfer/?category=products&file_format=json').status_code,
            401,
        )
        self.client.force_authenticate(self.customer)
        self.assertEqual(
            self.client.get('/api/dashboard/data/transfer/?category=products&file_format=json').status_code,
            403,
        )
