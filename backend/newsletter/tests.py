import json
from unittest.mock import patch

from django.test import override_settings
from django.core import signing
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from accounts.models import User
from rest_framework.test import APITestCase

from .models import Newsletter, Subscriber
from .services import ResendDeliveryError, sanitize_newsletter_html, send_resend_batch


class NewsletterApiTests(APITestCase):
    def test_subscribe_is_idempotent(self):
        payload = {'email': 'reader@example.com'}
        self.assertEqual(self.client.post('/api/newsletter/subscribe/', payload).status_code, 201)
        self.assertEqual(self.client.post('/api/newsletter/subscribe/', payload).status_code, 201)
        self.assertEqual(Subscriber.objects.count(), 1)

    def test_unsubscribe_deactivates_subscription(self):
        Subscriber.objects.create(email='reader@example.com')
        response = self.client.post('/api/newsletter/unsubscribe/', {'email': 'reader@example.com'})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Subscriber.objects.get().is_active)

    def test_signed_unsubscribe_link_deactivates_subscription(self):
        subscriber = Subscriber.objects.create(email='reader@example.com')
        token = signing.dumps(subscriber.email, salt='newsletter-unsubscribe')

        response = self.client.post('/api/newsletter/unsubscribe/', {'token': token})

        self.assertEqual(response.status_code, 200)
        subscriber.refresh_from_db()
        self.assertFalse(subscriber.is_active)

    def test_invalid_signed_unsubscribe_link_is_rejected(self):
        response = self.client.post('/api/newsletter/unsubscribe/', {'token': 'invalid-token'})

        self.assertEqual(response.status_code, 400)
        self.assertTrue(response.data['detail'])

    def test_public_newsletter_issues_returns_only_sent_sanitized_content(self):
        published = Newsletter.objects.create(
            subject='Harvest update',
            content_html='<h2>Harvest report</h2><script>alert(1)</script><p>Fresh coffee.</p>',
            status=Newsletter.Status.SENT,
            sent_at=timezone.now(),
        )
        Newsletter.objects.create(
            subject='Private draft',
            content_html='<p>Not public</p>',
            status=Newsletter.Status.DRAFT,
        )

        response = self.client.get('/api/newsletter/issues/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Cache-Control'], 'no-store')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], published.id)
        self.assertEqual(response.data[0]['subject'], 'Harvest update')
        self.assertIn('<h2>Harvest report</h2>', response.data[0]['content_html'])
        self.assertNotIn('<script>', response.data[0]['content_html'])
        self.assertNotIn('recipient_count', response.data[0])

    def setUp(self):
        self.staff = User.objects.create_user(
            username='newsletter-admin',
            email='staff@example.com',
            password='StrongPassword!2026',
            is_staff=True,
        )
        self.customer = User.objects.create_user(
            username='newsletter-customer',
            email='customer@example.com',
            password='StrongPassword!2026',
        )

    def test_newsletter_dashboard_endpoints_are_staff_only(self):
        self.assertEqual(self.client.get('/api/dashboard/newsletters/').status_code, 401)
        self.client.force_authenticate(self.customer)
        self.assertEqual(self.client.get('/api/dashboard/newsletters/').status_code, 403)
        self.assertEqual(
            self.client.post('/api/dashboard/newsletter-images/').status_code,
            403,
        )

    @patch('newsletter.views.upload_cloudinary_image')
    def test_staff_can_upload_newsletter_images(self, upload_image):
        upload_image.return_value = 'https://res.cloudinary.com/test/image/upload/newsletters/coffee.jpg'
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            '/api/dashboard/newsletter-images/',
            {'image': SimpleUploadedFile('coffee.jpg', b'image', content_type='image/jpeg')},
            format='multipart',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['url'], upload_image.return_value)
        upload_image.assert_called_once()

    def test_staff_can_save_and_list_sanitized_newsletter_drafts(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post('/api/dashboard/newsletters/', {
            'subject': 'Harvest update',
            'content_html': (
                '<h2>New harvest</h2><p><strong>Fresh coffee</strong></p>'
                '<script>alert(1)</script>'
                '<img src="https://res.cloudinary.com/test/image/upload/coffee.jpg" '
                'onerror="alert(1)">'
            ),
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], Newsletter.Status.DRAFT)
        self.assertIn('<strong>Fresh coffee</strong>', response.data['content_html'])
        self.assertNotIn('script', response.data['content_html'])
        self.assertNotIn('onerror', response.data['content_html'])
        self.assertEqual(Newsletter.objects.get().created_by, self.staff)
        self.assertEqual(self.client.get('/api/dashboard/newsletters/').data['count'], 1)

    def test_newsletter_draft_requires_a_subject_with_a_clear_message(self):
        self.client.force_authenticate(self.staff)

        response = self.client.post('/api/dashboard/newsletters/', {
            'subject': '   ',
            'content_html': '<p>Fresh coffee.</p>',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data['subject'][0],
            'Add a subject before saving this newsletter.',
        )

    def test_newsletter_html_sanitizer_removes_unsafe_markup_and_links(self):
        sanitized = sanitize_newsletter_html(
            '<p onclick="alert(1)">Hello</p>'
            '<a href="javascript:alert(1)">unsafe link</a>'
        )

        self.assertEqual(sanitized, '<p>Hello</p><span>unsafe link</span>')

    def test_newsletter_html_sanitizer_preserves_clickable_safe_links(self):
        sanitized = sanitize_newsletter_html(
            '<a href="https://example.com">Website</a>'
            '<a href="http://example.com">HTTP website</a>'
            '<a href="mailto:hello@example.com">Email</a>'
        )

        self.assertEqual(
            sanitized,
            '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Website</a>'
            '<a href="http://example.com" target="_blank" rel="noopener noreferrer">HTTP website</a>'
            '<a href="mailto:hello@example.com" target="_blank" rel="noopener noreferrer">Email</a>',
        )

    def test_newsletter_html_sanitizer_preserves_safe_image_size_and_alignment(self):
        sanitized = sanitize_newsletter_html(
            '<img src="https://res.cloudinary.com/test/image/upload/coffee.jpg" '
            'alt="Coffee" style="width:60%;margin:16px auto;position:absolute">'
        )

        self.assertIn('width:60%', sanitized)
        self.assertIn('margin:16px auto', sanitized)
        self.assertNotIn('position:absolute', sanitized)

    def test_newsletter_html_sanitizer_preserves_cropped_image_height(self):
        sanitized = sanitize_newsletter_html(
            '<img src="https://res.cloudinary.com/test/image/upload/coffee.jpg" '
            'alt="Coffee" style="width:100%;height:220px;object-fit:cover">'
        )

        self.assertIn('height:220px;object-fit:cover', sanitized)

    def test_newsletter_html_sanitizer_preserves_full_width_recommendation_cards(self):
        sanitized = sanitize_newsletter_html(
            '<div class="newsletter-recommendation">'
            '<img src="https://res.cloudinary.com/test/image/upload/coffee.jpg" '
            'alt="Coffee" style="width:100%;margin:16px 0">'
            '<h3 class="newsletter-recommendation-title">Coffee beans</h3>'
            '<p class="newsletter-recommendation-description">A fresh roast.</p>'
            '</div>'
        )

        self.assertIn(
            'style="display:block;width:100%;max-width:100%;height:auto;margin:16px 0"',
            sanitized,
        )
        self.assertIn('<h3>Coffee beans</h3>', sanitized)
        self.assertIn('<p>A fresh roast.</p>', sanitized)

    @override_settings(RESEND_API_KEY='re_test_key', NEWSLETTER_FROM_EMAIL='Legacy Coffee <news@example.com>')
    @patch('newsletter.views.send_resend_batch')
    def test_staff_can_send_newsletter_to_active_subscribers(self, send_batch):
        newsletter = Newsletter.objects.create(
            subject='Harvest update',
            content_html='<p>Fresh coffee from Uganda.</p>',
            created_by=self.staff,
        )
        Subscriber.objects.create(email='one@example.com')
        Subscriber.objects.create(email='two@example.com')
        Subscriber.objects.create(email='inactive@example.com', is_active=False)
        self.client.force_authenticate(self.staff)

        response = self.client.post(f'/api/dashboard/newsletters/{newsletter.pk}/send/')

        newsletter.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(newsletter.status, Newsletter.Status.SENT)
        self.assertEqual(newsletter.recipient_count, 2)
        self.assertCountEqual(newsletter.sent_emails, ['one@example.com', 'two@example.com'])
        send_batch.assert_called_once()
        self.assertCountEqual(send_batch.call_args.args[1], ['one@example.com', 'two@example.com'])

    @override_settings(RESEND_API_KEY='', NEWSLETTER_FROM_EMAIL='')
    def test_sending_newsletter_requires_resend_configuration(self):
        newsletter = Newsletter.objects.create(subject='Update', content_html='<p>Text</p>')
        self.client.force_authenticate(self.staff)

        response = self.client.post(f'/api/dashboard/newsletters/{newsletter.pk}/send/')

        newsletter.refresh_from_db()
        self.assertEqual(response.status_code, 503)
        self.assertEqual(newsletter.status, Newsletter.Status.DRAFT)

    @override_settings(RESEND_API_KEY='re_test_key', NEWSLETTER_FROM_EMAIL='news@example.com')
    @patch('newsletter.views.send_resend_batch', side_effect=ResendDeliveryError('Resend is unavailable.'))
    def test_failed_delivery_keeps_newsletter_as_retryable_draft(self, send_batch):
        newsletter = Newsletter.objects.create(subject='Update', content_html='<p>Text</p>')
        Subscriber.objects.create(email='reader@example.com')
        self.client.force_authenticate(self.staff)

        response = self.client.post(f'/api/dashboard/newsletters/{newsletter.pk}/send/')

        newsletter.refresh_from_db()
        self.assertEqual(response.status_code, 502)
        self.assertEqual(newsletter.status, Newsletter.Status.DRAFT)
        self.assertEqual(newsletter.last_error, 'Resend is unavailable.')
        send_batch.assert_called_once()

    @override_settings(RESEND_API_KEY='re_test_key', NEWSLETTER_FROM_EMAIL='news@example.com')
    @patch('newsletter.views.send_resend_batch')
    def test_partial_delivery_retry_skips_successful_batch(self, send_batch):
        newsletter = Newsletter.objects.create(subject='Update', content_html='<p>Text</p>')
        emails = [f'reader-{index}@example.com' for index in range(101)]
        Subscriber.objects.bulk_create([Subscriber(email=email) for email in emails])
        send_batch.side_effect = [None, ResendDeliveryError('The second batch failed.')]
        self.client.force_authenticate(self.staff)

        response = self.client.post(f'/api/dashboard/newsletters/{newsletter.pk}/send/')

        newsletter.refresh_from_db()
        self.assertEqual(response.status_code, 502)
        self.assertEqual(newsletter.status, Newsletter.Status.DRAFT)
        self.assertEqual(len(newsletter.sent_emails), 100)
        self.assertEqual(newsletter.recipient_count, 100)
        self.assertEqual(send_batch.call_count, 2)

        retry_emails = set(emails) - set(newsletter.sent_emails)
        send_batch.reset_mock()
        send_batch.side_effect = None

        retry_response = self.client.post(f'/api/dashboard/newsletters/{newsletter.pk}/send/')

        newsletter.refresh_from_db()
        self.assertEqual(retry_response.status_code, 200)
        self.assertEqual(newsletter.status, Newsletter.Status.SENT)
        self.assertEqual(newsletter.recipient_count, 101)
        send_batch.assert_called_once()
        self.assertCountEqual(send_batch.call_args.args[1], retry_emails)


class NewsletterDeliveryServiceTests(APITestCase):
    @override_settings(
        RESEND_API_KEY='re_test_key',
        NEWSLETTER_FROM_EMAIL='Legacy Coffee <news@example.com>',
        NEWSLETTER_PUBLIC_URL='https://legacycoffee.github.io/Legacy-Coffee',
    )
    @patch('newsletter.services.urlopen')
    def test_resend_batch_has_individual_recipients_and_unsubscribe_links(self, open_url):
        open_url.return_value.__enter__.return_value.read.return_value = json.dumps({
            'data': [{'id': 'email-1'}, {'id': 'email-2'}],
        }).encode()
        newsletter = Newsletter.objects.create(
            subject='Coffee update',
            content_html='<p>Fresh harvest.</p>',
        )

        send_resend_batch(newsletter, ['one@example.com', 'two@example.com'])

        request = open_url.call_args.args[0]
        payload = json.loads(request.data)
        self.assertEqual([message['to'] for message in payload], ['one@example.com', 'two@example.com'])
        self.assertIn('List-Unsubscribe', payload[0]['headers'])
        self.assertIn('newsletter?unsubscribe=', payload[0]['html'])
        self.assertIn(newsletter.content_html, payload[0]['html'])
