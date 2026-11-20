import hashlib
import logging
import re
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.error import URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from rest_framework.exceptions import APIException


logger = logging.getLogger(__name__)
FEED_CACHE_SECONDS = 900
MAX_FEED_BYTES = 2 * 1024 * 1024
MAX_POSTS = 12
CONTENT_NAMESPACE = '{http://purl.org/rss/1.0/modules/content/}encoded'
MEDIA_NAMESPACE = '{http://search.yahoo.com/mrss/}'


class SubstackFeedUnavailable(APIException):
    status_code = 502
    default_detail = 'The Substack feed is temporarily unavailable.'
    default_code = 'substack_feed_unavailable'


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def _plain_text(markup):
    parser = _TextExtractor()
    parser.feed(markup)
    text = ' '.join(' '.join(parser.parts).split())
    return re.sub(r'\s+([,.;:!?])', r'\1', text)


def _excerpt(markup):
    text = _plain_text(markup)
    return f'{text[:217].rstrip()}...' if len(text) > 220 else text


def _post_image(item, markup):
    for element in (
        item.find('enclosure'),
        item.find(f'{MEDIA_NAMESPACE}thumbnail'),
        item.find(f'{MEDIA_NAMESPACE}content'),
    ):
        if element is None:
            continue
        image_url = element.get('url')
        media_type = element.get('type', '')
        if image_url and (element.tag != 'enclosure' or not media_type or media_type.startswith('image/')):
            if urlsplit(image_url).scheme == 'https':
                return image_url

    image_match = re.search(r'<img\b[^>]*\bsrc=["\']([^"\']+)', markup, flags=re.IGNORECASE)
    if image_match and urlsplit(image_match.group(1)).scheme == 'https':
        return image_match.group(1)
    return ''


def _published_at(value):
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).isoformat()
    except (TypeError, ValueError, OverflowError):
        return None


def _parse_posts(payload, publication_url):
    root = ET.fromstring(payload)
    publication_host = urlsplit(publication_url).hostname
    posts = []
    for item in root.findall('./channel/item')[:MAX_POSTS]:
        title = (item.findtext('title') or '').strip()
        raw_link = (item.findtext('link') or item.findtext('guid') or '').strip()
        link = urljoin(f'{publication_url}/', raw_link)
        parsed_link = urlsplit(link)
        if not title or parsed_link.scheme != 'https' or parsed_link.hostname != publication_host:
            continue

        markup = item.findtext('description') or item.findtext(CONTENT_NAMESPACE) or ''
        post_id = (item.findtext('guid') or link).strip()
        posts.append({
            'id': post_id,
            'title': title,
            'url': link,
            'excerpt': _excerpt(markup),
            'published_at': _published_at(item.findtext('pubDate')),
            'image_url': _post_image(item, markup),
        })
    return posts


def get_substack_posts():
    publication_url = settings.SUBSTACK_PUBLICATION_URL.rstrip('/')
    publication = urlsplit(publication_url)
    if publication.scheme != 'https' or not publication.hostname or not publication.hostname.endswith('.substack.com'):
        raise SubstackFeedUnavailable('The configured Substack publication URL is invalid.')

    feed_url = f'{publication_url}/feed'
    cache_key = f'substack-feed:{hashlib.sha256(feed_url.encode()).hexdigest()}'
    cached_posts = cache.get(cache_key)
    if cached_posts is not None:
        return cached_posts

    request = Request(feed_url, headers={'User-Agent': 'LegacyCoffee/1.0'})
    try:
        with urlopen(request, timeout=10) as response:
            payload = response.read(MAX_FEED_BYTES + 1)
    except (URLError, TimeoutError, OSError) as error:
        logger.warning('Could not fetch the configured Substack feed: %s', error)
        raise SubstackFeedUnavailable() from error

    if len(payload) > MAX_FEED_BYTES:
        raise SubstackFeedUnavailable('The Substack feed exceeded the allowed size.')
    try:
        posts = _parse_posts(payload, publication_url)
    except ET.ParseError as error:
        logger.warning('The configured Substack feed returned invalid XML: %s', error)
        raise SubstackFeedUnavailable() from error

    cache.set(cache_key, posts, FEED_CACHE_SECONDS)
    return posts
