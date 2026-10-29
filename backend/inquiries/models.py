from django.db import models


class Inquiry(models.Model):
    class Kind(models.TextChoices):
        CONTACT = 'contact', 'Contact'
        QUOTE = 'quote', 'Quote'
        PARTNER = 'partner', 'Partner'
        FARM_RESERVATION = 'farm_reservation', 'Farm reservation'
        SEEDLING_RESERVATION = 'seedling_reservation', 'Seedling reservation'

    class Status(models.TextChoices):
        NEW = 'new', 'New'
        IN_PROGRESS = 'in_progress', 'In progress'
        RESOLVED = 'resolved', 'Resolved'

    kind = models.CharField(max_length=20, choices=Kind.choices)
    name = models.CharField(max_length=160)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    business_name = models.CharField(max_length=160, blank=True)
    product = models.CharField(max_length=160, blank=True)
    quantity = models.CharField(max_length=80, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.get_kind_display()} from {self.name}'
