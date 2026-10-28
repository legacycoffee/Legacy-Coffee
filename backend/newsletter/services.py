import html
import json
import re
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.conf import settings
from django.core import signing
from rest_framework.exceptions import APIException


ALLOWED_TAGS = {
    'a', 'blockquote', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'i',
    'li', 'mark', 'ol', 'p', 's', 'span', 'strong', 'u', 'ul',
}
VOID_TAGS = {'br', 'img'}
BLOCKED_TAGS = {'iframe', 'object', 'script', 'style', 'svg'}


class NewsletterHtmlSanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.output = []
        self.open_tags = []
        self.blocked_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in BLOCKED_TAGS:
            self.blocked_depth += 1
            return
        if self.blocked_depth or (tag not in ALLOWED_TAGS and tag != 'img'):
            return

        attributes = dict(attrs)
        if tag == 'a':
            href = attributes.get('href', '')
            if href.startswith(('https://', 'mailto:')):
                self.output.append(f'<a href="{html.escape(href, quote=True)}" rel="noopener noreferrer">')
                self.open_tags.append(tag)
                return
            self.output.append('<span>')
            self.open_tags.append('span')
            return
        if tag == 'img':
            src = attributes.get('src', '')
            if src.startswith('https://'):
                alt = html.escape(attributes.get('alt', ''), quote=True)
                width = attributes.get('style', '')
                width_match = re.search(r'(?:^|;)\s*width:\s*(\d{1,3})%\s*(?:;|$)', width)
                width_percent = min(100, max(10, int(width_match.group(1)))) if width_match else 100
                margin_match = re.search(r'(?:^|;)\s*margin:\s*([^;]+)', width)
                alignment = margin_match.group(1).strip() if margin_match else '16px 0'
                if alignment not in {'16px 0', '16px auto', '16px 0 16px auto'}:
                    alignment = '16px 0'
                self.output.append(
                    f'<img src="{html.escape(src, quote=True)}" alt="{alt}" '
                    f'style="display:block;width:{width_percent}%;max-width:100%;height:auto;margin:{alignment}">'
                )
            return

        self.output.append(f'<{tag}>')
        if tag not in VOID_TAGS:
            self.open_tags.append(tag)

    def handle_endtag(self, tag):
        if tag in BLOCKED_TAGS:
            self.blocked_depth = max(0, self.blocked_depth - 1)
            return
        if self.blocked_depth:
            return
        if tag not in ALLOWED_TAGS and tag != 'img':
            return
        closing_tag = tag
        if tag == 'a' and (not self.open_tags or self.open_tags[-1] != 'a'):
            closing_tag = 'span'
        if closing_tag in self.open_tags:
            while self.open_tags:
                opened = self.open_tags.pop()
                self.output.append(f'</{opened}>')
                if opened == closing_tag:
                    break

    def handle_data(self, data):
        if not self.blocked_depth:
            self.output.append(html.escape(data))

    def get_html(self):
        while self.open_tags:
            self.output.append(f'</{self.open_tags.pop()}>')
        return ''.join(self.output).strip()


def sanitize_newsletter_html(content):
    parser = NewsletterHtmlSanitizer()
    parser.feed(content)
    parser.close()
    return parser.get_html()


class ResendConfigurationError(APIException):
    status_code = 503
    default_detail = 'Newsletter delivery is not configured. Set RESEND_API_KEY and NEWSLETTER_FROM_EMAIL in Railway.'
    default_code = 'resend_not_configured'


class ResendDeliveryError(APIException):
    status_code = 502
    default_detail = 'Resend could not deliver this newsletter.'
    default_code = 'resend_delivery_failed'


def send_resend_batch(newsletter, recipients):
    api_key = getattr(settings, 'RESEND_API_KEY', '')
    from_email = getattr(settings, 'NEWSLETTER_FROM_EMAIL', '')
    if not api_key or not from_email:
        raise ResendConfigurationError()

    public_url = getattr(settings, 'NEWSLETTER_PUBLIC_URL', 'https://legacycoffee.github.io/Legacy-Coffee').rstrip('/')
    messages = []
    for recipient in recipients:
        token = signing.dumps(recipient, salt='newsletter-unsubscribe')
        unsubscribe_url = f'{public_url}/newsletter?unsubscribe={quote(token)}'
        messages.append({
            'from': from_email,
            'to': recipient,
            'subject': newsletter.subject,
            'headers': {'List-Unsubscribe': f'<{unsubscribe_url}>'},
            'html': (
            '<!doctype html><html><body style="margin:0;background:#f4eee8;'
            'font-family:Arial,sans-serif;color:#2b211b">'
            '<div style="max-width:680px;margin:0 auto;padding:24px">'
            '<div style="background:#fff;padding:32px">'
            f'{newsletter.content_html}'
            '</div><p style="font-size:12px;color:#777;text-align:center">'
            'You are receiving this email because you subscribed to Legacy Coffee updates.'
            f' <a href="{unsubscribe_url}" style="color:#70432d">Unsubscribe</a>.'
            '</p></div></body></html>'
            ),
        })
    request = Request(
        'https://api.resend.com/emails/batch',
        data=json.dumps(messages).encode(),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urlopen(request, timeout=30) as response:
            result = json.loads(response.read())
    except HTTPError as error:
        try:
            details = json.loads(error.read()).get('message')
        except (json.JSONDecodeError, AttributeError):
            details = None
        raise ResendDeliveryError(details or 'Resend rejected the newsletter batch.') from error
    except (URLError, TimeoutError) as error:
        raise ResendDeliveryError('Resend could not be reached. Please try again.') from error
    except json.JSONDecodeError as error:
        raise ResendDeliveryError('Resend returned an invalid response.') from error

    results = result.get('data') if isinstance(result, dict) else None
    if not isinstance(results, list) or len(results) != len(recipients):
        raise ResendDeliveryError('Resend returned an incomplete batch response.')
