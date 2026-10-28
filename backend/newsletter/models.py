from django.conf import settings
from django.db import models


class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-subscribed_at',)

    def __str__(self):
        return self.email


class Newsletter(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENDING = 'sending', 'Sending'
        SENT = 'sent', 'Sent'

    subject = models.CharField(max_length=180)
    content_html = models.TextField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT)
    recipient_count = models.PositiveIntegerField(default=0)
    sent_emails = models.JSONField(default=list, blank=True)
    last_error = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='newsletters',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    sending_started_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-updated_at',)

    def __str__(self):
        return self.subject
