import json
import logging
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.conf import settings


logger = logging.getLogger(__name__)
RESERVATION_EMAIL = 'info@legacycoffee.org'
RESEND_EMAILS_URL = 'https://api.resend.com/emails'


def send_reservation_notification(inquiry):
    api_key = getattr(settings, 'RESEND_API_KEY', '')
    from_email = getattr(settings, 'NEWSLETTER_FROM_EMAIL', '')
    if not api_key or not from_email:
        logger.error(
            'Reservation %s was recorded but email delivery is not configured.',
            inquiry.pk,
        )
        return

    subject_name = ' '.join(inquiry.name.split())
    message = '\n'.join((
        f'Reservation type: {inquiry.get_kind_display()}',
        f'Request number: {inquiry.pk}',
        f'Name: {inquiry.name}',
        f'Email: {inquiry.email}',
        f'Phone: {inquiry.phone or "Not provided"}',
        f'Package or product: {inquiry.product or "Not provided"}',
        f'Quantity or visitors: {inquiry.quantity or "Not provided"}',
        '',
        'Additional details:',
        inquiry.message,
    ))
    payload = {
        'from': from_email,
        'to': [RESERVATION_EMAIL],
        'reply_to': inquiry.email,
        'subject': f'{inquiry.get_kind_display()} - {subject_name}',
        'text': message,
    }
    request = Request(
        RESEND_EMAILS_URL,
        data=json.dumps(payload).encode(),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with urlopen(request, timeout=15) as response:
            if not 200 <= response.status < 300:
                logger.error(
                    'Email delivery failed for reservation %s with HTTP status %s.',
                    inquiry.pk,
                    response.status,
                )
                return
            response.read()
    except (URLError, TimeoutError, OSError):
        logger.exception('Email delivery failed for reservation %s.', inquiry.pk)
