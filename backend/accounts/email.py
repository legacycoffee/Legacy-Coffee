import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


logger = logging.getLogger(__name__)
RESEND_EMAILS_URL = 'https://api.resend.com/emails'


def _send_resend_email(recipients, subject, text, event, reference):
    api_key = getattr(settings, 'RESEND_API_KEY', '')
    from_email = getattr(settings, 'NEWSLETTER_FROM_EMAIL', '')
    if not api_key or not from_email:
        logger.error(
            '%s for %s was not sent because Resend is not configured.',
            event,
            reference,
        )
        return False

    payload = {
        'from': from_email,
        'to': recipients,
        'subject': subject,
        'text': text,
    }
    request = Request(
        RESEND_EMAILS_URL,
        data=json.dumps(payload).encode('utf-8'),
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
                    'Resend rejected %s for %s with HTTP status %s.',
                    event,
                    reference,
                    response.status,
                )
                return False
            response.read()
    except HTTPError as error:
        logger.error(
            'Resend rejected %s for %s with HTTP status %s.',
            event,
            reference,
            error.code,
        )
        return False
    except (URLError, TimeoutError, OSError):
        logger.exception('Resend delivery failed for %s (%s).', event, reference)
        return False

    return True


def send_welcome_email(user):
    if not user.email:
        logger.info('Welcome email skipped for user %s without an email address.', user.pk)
        return False

    name = ' '.join((user.first_name or '').split()) or 'there'
    text = (
        f'Hello {name},\n\n'
        'Welcome to Legacy Coffee. Your account is ready, and you can now manage '
        'your profile and orders on our website.\n\n'
        'Thank you for choosing Legacy Coffee.'
    )
    return _send_resend_email(
        [user.email],
        'Welcome to Legacy Coffee',
        text,
        'Welcome email',
        f'user {user.pk}',
    )


def send_order_status_email(order, status_label):
    recipients = []
    seen = set()
    for address in (
        order.customer_email,
        order.user.email if order.user_id else None,
    ):
        address = (address or '').strip()
        normalized_address = address.casefold()
        if address and normalized_address not in seen:
            recipients.append(address)
            seen.add(normalized_address)

    if not recipients:
        logger.info('Order status email skipped for order %s without an email address.', order.reference)
        return False

    name = ' '.join((order.customer_name or '').split()) or 'there'
    text = (
        f'Hello {name},\n\n'
        f'The status of your Legacy Coffee order {order.reference} has been updated.\n'
        f'Current status: {status_label}.\n\n'
        'Thank you for choosing Legacy Coffee.'
    )
    results = [
        _send_resend_email(
            [recipient],
            f'Order {order.reference}: {status_label}',
            text,
            'Order status email',
            f'order {order.reference}',
        )
        for recipient in recipients
    ]
    return all(results)
