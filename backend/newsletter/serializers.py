from rest_framework import serializers

from .models import Newsletter, Subscriber
from .services import sanitize_newsletter_html

class SubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def create(self, validated_data):
        subscriber, _ = Subscriber.objects.update_or_create(
            email=validated_data['email'].lower(),
            defaults={'is_active': True, 'unsubscribed_at': None},
        )
        return subscriber


class PublicNewsletterSerializer(serializers.ModelSerializer):
    content_html = serializers.SerializerMethodField()

    class Meta:
        model = Newsletter
        fields = ('id', 'subject', 'content_html', 'sent_at')

    def get_content_html(self, newsletter):
        return sanitize_newsletter_html(newsletter.content_html)
