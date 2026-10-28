import uuid
from datetime import timedelta

from django.conf import settings
from django.core import signing
from django.core.signing import BadSignature
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from django.utils import timezone
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.services import upload_cloudinary_image
from .dashboard_serializers import NewsletterSerializer
from .models import Newsletter, Subscriber
from .serializers import SubscribeSerializer
from .services import ResendConfigurationError, ResendDeliveryError, send_resend_batch


class NewsletterConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'This newsletter cannot be changed or sent in its current state.'
    default_code = 'newsletter_not_editable'


class SubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscriber = serializer.save()
        return Response(
            {'message': 'Subscription saved.', 'email': subscriber.email},
            status=status.HTTP_201_CREATED,
        )


class UnsubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        token = request.data.get('token')
        if token:
            try:
                email = signing.loads(token, salt='newsletter-unsubscribe')
            except BadSignature:
                return Response({'detail': 'This unsubscribe link is invalid.'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(email, str) or not email.strip():
            return Response({'email': 'A valid email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
        Subscriber.objects.filter(email__iexact=email.strip(), is_active=True).update(
            is_active=False,
            unsubscribed_at=timezone.now(),
        )
        return Response({'message': 'If the address was subscribed, it has been unsubscribed.'})


class NewsletterImageUploadView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            raise ValidationError({'image': 'Choose an image to upload.'})
        image_url = upload_cloudinary_image(
            image,
            f'newsletters/{slugify(image.name.rsplit(".", 1)[0])[:80]}-{uuid.uuid4().hex}',
            field_name='image',
            image_label='newsletter image',
        )
        return Response({'url': image_url}, status=status.HTTP_201_CREATED)


class NewsletterListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = NewsletterSerializer
    queryset = Newsletter.objects.all()


class NewsletterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = NewsletterSerializer
    queryset = Newsletter.objects.all()

    def perform_update(self, serializer):
        if serializer.instance.status != Newsletter.Status.DRAFT:
            raise NewsletterConflict('Only draft newsletters can be edited.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.status != Newsletter.Status.DRAFT:
            raise NewsletterConflict('Only draft newsletters can be deleted.')
        instance.delete()


class NewsletterSendView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        if not getattr(settings, 'RESEND_API_KEY', '') or not getattr(settings, 'NEWSLETTER_FROM_EMAIL', ''):
            raise ResendConfigurationError()

        with transaction.atomic():
            newsletter = get_object_or_404(
                Newsletter.objects.select_for_update(),
                pk=pk,
            )
            if newsletter.status == Newsletter.Status.SENT:
                raise NewsletterConflict('This newsletter has already been sent.')
            if (
                newsletter.status == Newsletter.Status.SENDING
                and newsletter.sending_started_at
                and newsletter.sending_started_at > timezone.now() - timedelta(minutes=15)
            ):
                raise NewsletterConflict('This newsletter is already being sent.')

            recipients = list(
                Subscriber.objects.filter(is_active=True)
                .exclude(email__in=newsletter.sent_emails)
                .values_list('email', flat=True)
            )
            if not recipients:
                if newsletter.sent_emails:
                    newsletter.status = Newsletter.Status.SENT
                    newsletter.sent_at = timezone.now()
                    newsletter.recipient_count = len(newsletter.sent_emails)
                    newsletter.save(update_fields=('status', 'sent_at', 'recipient_count', 'updated_at'))
                    return Response(NewsletterSerializer(newsletter).data)
                raise serializers.ValidationError({'detail': 'There are no active subscribers to send to.'})

            newsletter.status = Newsletter.Status.SENDING
            newsletter.sending_started_at = timezone.now()
            newsletter.last_error = ''
            newsletter.recipient_count = len(newsletter.sent_emails) + len(recipients)
            newsletter.save(update_fields=(
                'status', 'sending_started_at', 'last_error', 'recipient_count', 'updated_at',
            ))

        sent_emails = list(newsletter.sent_emails)
        try:
            for offset in range(0, len(recipients), 100):
                batch = recipients[offset:offset + 100]
                send_resend_batch(newsletter, batch)
                sent_emails.extend(batch)
                Newsletter.objects.filter(pk=newsletter.pk).update(
                    sent_emails=sent_emails,
                    sending_started_at=timezone.now(),
                    updated_at=timezone.now(),
                )
        except ResendDeliveryError as error:
            Newsletter.objects.filter(pk=newsletter.pk).update(
                status=Newsletter.Status.DRAFT,
                sent_emails=sent_emails,
                recipient_count=len(sent_emails),
                last_error=str(error.detail),
                sending_started_at=None,
                updated_at=timezone.now(),
            )
            raise

        newsletter.refresh_from_db()
        newsletter.sent_emails = sent_emails
        newsletter.recipient_count = len(sent_emails)
        newsletter.status = Newsletter.Status.SENT
        newsletter.sent_at = timezone.now()
        newsletter.last_error = ''
        newsletter.sending_started_at = None
        newsletter.save(update_fields=(
            'sent_emails', 'recipient_count', 'status', 'sent_at',
            'last_error', 'sending_started_at', 'updated_at',
        ))
        return Response(NewsletterSerializer(newsletter).data)
