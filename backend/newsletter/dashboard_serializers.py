from rest_framework import serializers
from django.utils.html import strip_tags

from .models import Newsletter
from .services import sanitize_newsletter_html


class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = (
            'id', 'subject', 'content_html', 'status', 'recipient_count',
            'last_error', 'created_at', 'updated_at', 'sent_at',
        )
        read_only_fields = (
            'id', 'status', 'recipient_count', 'last_error',
            'created_at', 'updated_at', 'sent_at',
        )
        extra_kwargs = {
            'subject': {'allow_blank': True},
        }

    def validate_subject(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Add a subject before saving this newsletter.')
        return value

    def validate_content_html(self, value):
        sanitized = sanitize_newsletter_html(value)
        text_only = strip_tags(sanitized).strip()
        if not text_only and '<img ' not in sanitized:
            raise serializers.ValidationError('Add newsletter text or an image before saving.')
        return sanitized

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
