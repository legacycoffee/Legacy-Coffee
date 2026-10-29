import uuid

from django.db import models


class AnonymousVisitor(models.Model):
    visitor_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_seen_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    is_registered = models.BooleanField(default=False, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=('is_registered', 'first_seen_at')),
        ]
