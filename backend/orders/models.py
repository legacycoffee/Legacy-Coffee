import uuid

from django.conf import settings
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


def generate_order_reference():
    return f'LC-{uuid.uuid4().hex[:10].upper()}'


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        FULFILLED = 'fulfilled', 'Fulfilled'
        CANCELLED = 'cancelled', 'Cancelled'

    reference = models.CharField(max_length=16, unique=True, default=generate_order_reference)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='orders',
    )
    customer_name = models.CharField(max_length=160)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=40)
    delivery_address = models.CharField(max_length=250)
    delivery_city = models.CharField(max_length=120)
    delivery_notes = models.TextField(blank=True)
    delivery_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    delivery_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total = models.DecimalField(max_digits=14, decimal_places=0, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return self.reference


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'shop.Product',
        null=True,
        on_delete=models.SET_NULL,
        related_name='order_items',
    )
    product_name = models.CharField(max_length=160)
    weight = models.CharField(max_length=40)
    unit_price = models.DecimalField(max_digits=12, decimal_places=0)
    quantity = models.PositiveSmallIntegerField()

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f'{self.product_name} × {self.quantity}'
