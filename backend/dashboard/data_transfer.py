import csv
import io
import json
import xml.etree.ElementTree as ET
from datetime import datetime

from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from inquiries.models import Inquiry
from newsletter.models import Newsletter, Subscriber
from newsletter.services import sanitize_newsletter_html
from shop.models import Product, ShareEvent

from .models import AnonymousVisitor


MAX_IMPORT_SIZE = 5 * 1024 * 1024
MAX_IMPORT_RECORDS = 5000


class ProductImportSerializer(serializers.Serializer):
    slug = serializers.SlugField(max_length=120)
    name = serializers.CharField(max_length=160)
    coffee_type = serializers.ChoiceField(choices=Product.CoffeeType.choices)
    weight = serializers.CharField(max_length=40)
    price = serializers.DecimalField(max_digits=12, decimal_places=0, required=False, allow_null=True)
    wholesale_price = serializers.DecimalField(max_digits=12, decimal_places=0, required=False, allow_null=True)
    description = serializers.CharField()
    details = serializers.CharField()
    tasting_notes = serializers.CharField(max_length=300, required=False, allow_blank=True)
    roast = serializers.CharField(max_length=60)
    image_alt = serializers.CharField(max_length=250, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False, default=True)

class InquiryImportSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=Inquiry.Kind.choices)
    name = serializers.CharField(max_length=160)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    business_name = serializers.CharField(max_length=160, required=False, allow_blank=True)
    product = serializers.CharField(max_length=160, required=False, allow_blank=True)
    quantity = serializers.CharField(max_length=80, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True)
    message = serializers.CharField()
    status = serializers.ChoiceField(choices=Inquiry.Status.choices, required=False, default=Inquiry.Status.NEW)
    created_at = serializers.DateTimeField(required=False)


class NewsletterImportSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=180)
    content_html = serializers.CharField()
    status = serializers.ChoiceField(choices=Newsletter.Status.choices, required=False)
    created_at = serializers.DateTimeField(required=False)


class SubscriberImportSerializer(serializers.Serializer):
    email = serializers.EmailField()
    is_active = serializers.BooleanField(required=False, default=True)
    subscribed_at = serializers.DateTimeField(required=False)
    unsubscribed_at = serializers.DateTimeField(required=False, allow_null=True)


class VisitorImportSerializer(serializers.Serializer):
    visitor_id = serializers.UUIDField()
    first_seen_at = serializers.DateTimeField(required=False)
    last_seen_at = serializers.DateTimeField(required=False)
    is_registered = serializers.BooleanField(required=False, default=False)


class ShareImportSerializer(serializers.Serializer):
    product_slug = serializers.SlugField(max_length=120)
    product_name = serializers.CharField(max_length=160)
    channel = serializers.ChoiceField(choices=ShareEvent.Channel.choices)
    created_at = serializers.DateTimeField(required=False)


TRANSFER_TYPES = {
    'products': {
        'product': {
            'serializer': ProductImportSerializer,
            'fields': (
                'slug', 'name', 'coffee_type', 'weight', 'price', 'wholesale_price',
                'description', 'details', 'tasting_notes', 'roast', 'image_alt', 'is_active',
            ),
        },
    },
    'requests': {
        'inquiry': {
            'serializer': InquiryImportSerializer,
            'fields': (
                'kind', 'name', 'email', 'phone', 'business_name', 'product', 'quantity',
                'subject', 'message', 'status', 'created_at',
            ),
        },
    },
    'newsletters': {
        'newsletter': {
            'serializer': NewsletterImportSerializer,
            'fields': ('subject', 'content_html', 'status', 'created_at'),
        },
        'subscriber': {
            'serializer': SubscriberImportSerializer,
            'fields': ('email', 'is_active', 'subscribed_at', 'unsubscribed_at'),
        },
    },
    'analytics': {
        'visitor': {
            'serializer': VisitorImportSerializer,
            'fields': ('visitor_id', 'first_seen_at', 'last_seen_at', 'is_registered'),
        },
        'product_share': {
            'serializer': ShareImportSerializer,
            'fields': ('product_slug', 'product_name', 'channel', 'created_at'),
        },
    },
}


def _export_records(category):
    if category == 'products':
        return [
            {
                'record_type': 'product',
                'slug': item.slug,
                'name': item.name,
                'coffee_type': item.coffee_type,
                'weight': item.weight,
                'price': item.price,
                'wholesale_price': item.wholesale_price,
                'description': item.description,
                'details': item.details,
                'tasting_notes': item.tasting_notes,
                'roast': item.roast,
                'image_alt': item.image_alt,
                'is_active': item.is_active,
            }
            for item in Product.objects.all()
        ]
    if category == 'requests':
        return [
            {
                'record_type': 'inquiry',
                'kind': item.kind,
                'name': item.name,
                'email': item.email,
                'phone': item.phone,
                'business_name': item.business_name,
                'product': item.product,
                'quantity': item.quantity,
                'subject': item.subject,
                'message': item.message,
                'status': item.status,
                'created_at': item.created_at,
            }
            for item in Inquiry.objects.all()
        ]
    if category == 'newsletters':
        newsletters = [
            {
                'record_type': 'newsletter',
                'subject': item.subject,
                'content_html': item.content_html,
                'status': item.status,
                'created_at': item.created_at,
            }
            for item in Newsletter.objects.all()
        ]
        subscribers = [
            {
                'record_type': 'subscriber',
                'email': item.email,
                'is_active': item.is_active,
                'subscribed_at': item.subscribed_at,
                'unsubscribed_at': item.unsubscribed_at,
            }
            for item in Subscriber.objects.all()
        ]
        return newsletters + subscribers
    visitors = [
        {
            'record_type': 'visitor',
            'visitor_id': item.visitor_id,
            'first_seen_at': item.first_seen_at,
            'last_seen_at': item.last_seen_at,
            'is_registered': item.is_registered,
        }
        for item in AnonymousVisitor.objects.all()
    ]
    shares = [
        {
            'record_type': 'product_share',
            'product_slug': item.product_slug,
            'product_name': item.product_name,
            'channel': item.channel,
            'created_at': item.created_at,
        }
        for item in ShareEvent.objects.all()
    ]
    return visitors + shares


def _format_value(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if value is None:
        return ''
    return str(value)


def _export_file(category, file_format, records):
    filename = f'legacy-coffee-{category}.{file_format}'
    if file_format == 'json':
        content = json.dumps(
            {'format_version': 1, 'category': category, 'records': records},
            default=_format_value,
            ensure_ascii=False,
            indent=2,
        )
        content_type = 'application/json; charset=utf-8'
    elif file_format == 'csv':
        output = io.StringIO(newline='')
        fieldnames = ['category', 'record_type']
        for record in records:
            for field in record:
                if field != 'record_type' and field not in fieldnames:
                    fieldnames.append(field)
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for record in records:
            row = {'category': category, **record}
            writer.writerow({key: _format_value(value) for key, value in row.items()})
        content = output.getvalue()
        content_type = 'text/csv; charset=utf-8'
    else:
        root = ET.Element('data', {'format_version': '1', 'category': category})
        record_list = ET.SubElement(root, 'records')
        for record in records:
            element = ET.SubElement(record_list, 'record', {'type': record['record_type']})
            for field, value in record.items():
                if field != 'record_type':
                    ET.SubElement(element, field).text = _format_value(value)
        content = ET.tostring(root, encoding='unicode', xml_declaration=True)
        content_type = 'application/xml; charset=utf-8'
    response = HttpResponse(content, content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def _read_import_file(upload, category):
    if upload.size > MAX_IMPORT_SIZE:
        raise serializers.ValidationError({'file': 'The import file must be 5 MB or smaller.'})
    extension = upload.name.rsplit('.', 1)[-1].lower() if '.' in upload.name else ''
    if extension not in ('json', 'csv', 'xml'):
        raise serializers.ValidationError({'file': 'Choose a JSON, CSV, or XML file.'})
    try:
        text = upload.read().decode('utf-8-sig')
    except UnicodeDecodeError as error:
        raise serializers.ValidationError({'file': 'The file must use UTF-8 text encoding.'}) from error

    try:
        if extension == 'json':
            bundle = json.loads(text)
            if (
                not isinstance(bundle, dict)
                or bundle.get('format_version') != 1
                or bundle.get('category') != category
                or not isinstance(bundle.get('records'), list)
            ):
                raise serializers.ValidationError({
                    'file': 'This JSON file is not a supported export for the selected category.',
                })
            records = bundle['records']
        elif extension == 'csv':
            rows = list(csv.DictReader(io.StringIO(text)))
            if any(row.get('category') != category for row in rows):
                raise serializers.ValidationError({
                    'file': 'This CSV file does not match the selected category.',
                })
            records = [
                {'record_type': row.pop('record_type', ''), **{
                    key: value for key, value in row.items() if key != 'category'
                }}
                for row in rows
            ]
            if not rows:
                raise serializers.ValidationError({'file': 'The CSV file does not contain any records.'})
        else:
            root = ET.fromstring(text)
            if root.tag != 'data' or root.get('format_version') != '1' or root.get('category') != category:
                raise serializers.ValidationError({
                    'file': 'This XML file is not a supported export for the selected category.',
                })
            record_list = root.find('records')
            if record_list is None:
                raise serializers.ValidationError({'file': 'The XML file is missing its records list.'})
            records = []
            for element in record_list.findall('record'):
                record = {'record_type': element.get('type', '')}
                for field in element:
                    if field.tag in record:
                        raise serializers.ValidationError({'file': f'Duplicate XML field: {field.tag}.'})
                    record[field.tag] = field.text or ''
                records.append(record)
    except (json.JSONDecodeError, csv.Error, ET.ParseError) as error:
        raise serializers.ValidationError({'file': f'The import file could not be parsed: {error}'}) from error

    if len(records) > MAX_IMPORT_RECORDS:
        raise serializers.ValidationError({'file': f'An import may contain at most {MAX_IMPORT_RECORDS} records.'})
    if not records:
        raise serializers.ValidationError({'file': 'The import file does not contain any records.'})
    return extension, records


def _record_identity(record_type, data):
    if record_type == 'product':
        return data['slug']
    if record_type == 'inquiry':
        return (data['kind'], data['email'].lower(), data['subject'], data['message'], data['created_at'])
    if record_type == 'newsletter':
        return (data['subject'], data['content_html'])
    if record_type == 'subscriber':
        return data['email'].lower()
    if record_type == 'visitor':
        return str(data['visitor_id'])
    return (data['product_slug'], data['product_name'], data['channel'], data['created_at'])


def _existing_record(record_type, data):
    if record_type == 'product':
        return Product.objects.filter(slug=data['slug']).exists()
    if record_type == 'inquiry':
        return Inquiry.objects.filter(
            kind=data['kind'],
            email__iexact=data['email'],
            subject=data['subject'],
            message=data['message'],
            created_at=data['created_at'],
        ).exists()
    if record_type == 'newsletter':
        return Newsletter.objects.filter(subject=data['subject'], content_html=data['content_html']).exists()
    if record_type == 'subscriber':
        return Subscriber.objects.filter(email__iexact=data['email']).exists()
    if record_type == 'visitor':
        return AnonymousVisitor.objects.filter(visitor_id=data['visitor_id']).exists()
    return ShareEvent.objects.filter(
        product_slug=data['product_slug'],
        product_name=data['product_name'],
        channel=data['channel'],
        created_at=data['created_at'],
    ).exists()


def _normalize_empty_values(record_type, data):
    optional_null_fields = {
        'product': ('price', 'wholesale_price'),
        'subscriber': ('unsubscribed_at',),
    }
    for field in optional_null_fields.get(record_type, ()):
        if data.get(field) == '':
            data[field] = None


def _create_imported_record(record_type, data, request):
    if record_type == 'newsletter':
        data['status'] = Newsletter.Status.DRAFT
    if record_type == 'product':
        Product.objects.create(**data)
    elif record_type == 'inquiry':
        created_at = data.pop('created_at')
        item = Inquiry.objects.create(**data)
        Inquiry.objects.filter(pk=item.pk).update(created_at=created_at)
    elif record_type == 'newsletter':
        created_at = data.pop('created_at')
        item = Newsletter.objects.create(created_by=request.user, **data)
        Newsletter.objects.filter(pk=item.pk).update(created_at=created_at)
    elif record_type == 'subscriber':
        subscribed_at = data.pop('subscribed_at', timezone.now())
        item = Subscriber.objects.create(**data)
        Subscriber.objects.filter(pk=item.pk).update(subscribed_at=subscribed_at)
    elif record_type == 'visitor':
        first_seen_at = data.pop('first_seen_at', timezone.now())
        last_seen_at = data.pop('last_seen_at', first_seen_at)
        item = AnonymousVisitor.objects.create(**data)
        AnonymousVisitor.objects.filter(pk=item.pk).update(
            first_seen_at=first_seen_at,
            last_seen_at=last_seen_at,
        )
    else:
        created_at = data.pop('created_at')
        data['product_id'] = data['product_slug'] if Product.objects.filter(slug=data['product_slug']).exists() else None
        item = ShareEvent.objects.create(**data)
        ShareEvent.objects.filter(pk=item.pk).update(created_at=created_at)


class DataTransferView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        category = request.query_params.get('category')
        file_format = request.query_params.get('file_format')
        if category not in TRANSFER_TYPES:
            raise serializers.ValidationError({'category': 'Choose a supported business-data category.'})
        if file_format not in ('json', 'csv', 'xml'):
            raise serializers.ValidationError({'file_format': 'Choose JSON, CSV, or XML.'})
        return _export_file(category, file_format, _export_records(category))

    @transaction.atomic
    def post(self, request):
        category = request.data.get('category')
        if category not in TRANSFER_TYPES:
            raise serializers.ValidationError({'category': 'Choose a supported business-data category.'})
        upload = request.FILES.get('file')
        if upload is None:
            raise serializers.ValidationError({'file': 'Choose a data file to import.'})

        extension, records = _read_import_file(upload, category)
        allowed_types = TRANSFER_TYPES[category]
        validated_records = []
        seen_records = set()
        for index, record in enumerate(records, start=1):
            if not isinstance(record, dict):
                raise serializers.ValidationError({'records': f'Record {index} must be an object.'})
            record_type = record.get('record_type')
            if not isinstance(record_type, str):
                raise serializers.ValidationError({
                    'records': f'Record {index} must specify a record type.',
                })
            type_config = allowed_types.get(record_type)
            if type_config is None:
                raise serializers.ValidationError({
                    'records': f'Record {index} has an unsupported record type for {category}.',
                })
            payload = {key: value for key, value in record.items() if key != 'record_type'}
            unknown_fields = set(payload) - set(type_config['fields'])
            if unknown_fields:
                field = next(iter(unknown_fields))
                message = 'Product images must be uploaded separately; image URLs are not accepted.' if field == 'image' else f'Unsupported field: {field}.'
                raise serializers.ValidationError({'records': f'Record {index}: {message}'})
            _normalize_empty_values(record_type, payload)
            serializer = type_config['serializer'](data=payload)
            if not serializer.is_valid():
                raise serializers.ValidationError({'records': {index: serializer.errors}})
            data = serializer.validated_data
            if record_type == 'inquiry':
                for field in ('phone', 'business_name', 'product', 'quantity', 'subject'):
                    data.setdefault(field, '')
                data.setdefault('created_at', timezone.now())
            elif record_type == 'newsletter':
                data['content_html'] = sanitize_newsletter_html(data['content_html'])
                data.setdefault('created_at', timezone.now())
            elif record_type == 'subscriber':
                data.setdefault('subscribed_at', timezone.now())
            elif record_type == 'visitor':
                data.setdefault('first_seen_at', timezone.now())
                data.setdefault('last_seen_at', data['first_seen_at'])
            elif record_type == 'product_share':
                data.setdefault('created_at', timezone.now())
            identity = (record_type, _record_identity(record_type, data))
            if identity in seen_records or _existing_record(record_type, data):
                raise serializers.ValidationError({'records': f'Record {index} is a duplicate; no records were imported.'})
            seen_records.add(identity)
            validated_records.append((record_type, data))

        for record_type, data in validated_records:
            _create_imported_record(record_type, data, request)

        counts = {
            'products': Product.objects.count(),
            'requests': Inquiry.objects.count(),
            'newsletters': Newsletter.objects.count(),
            'subscribers': Subscriber.objects.count(),
            'visitors': AnonymousVisitor.objects.count(),
            'product_shares': ShareEvent.objects.count(),
        }
        return Response({
            'category': category,
            'format': extension,
            'imported_count': len(validated_records),
            'counts': counts,
            'notice': 'Imported newsletters are saved as drafts and are never sent automatically. Product images are not included.',
        }, status=status.HTTP_201_CREATED)
