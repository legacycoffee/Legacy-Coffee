from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class UserManager(DjangoUserManager):
    @classmethod
    def normalize_email(cls, email):
        if email is None:
            return None
        return super().normalize_email(email)


class User(AbstractUser):
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=40, unique=True, blank=True, null=True)
    delivery_address = models.CharField(max_length=250, blank=True)
    delivery_city = models.CharField(max_length=120, blank=True)
    delivery_notes = models.TextField(blank=True)
    must_change_password = models.BooleanField(default=False)
    location_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    location_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    profile_photo = models.TextField(blank=True)
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email or self.phone or self.username


class Notification(models.Model):
    class Kind(models.TextChoices):
        WELCOME = 'welcome', 'Welcome'
        SIGN_IN = 'sign_in', 'Sign in'
        ORDER_SUBMITTED = 'order_submitted', 'Order submitted'
        ORDER_STATUS = 'order_status', 'Order status'

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    title = models.CharField(max_length=160)
    message = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at', '-id')

    def __str__(self):
        return f'{self.title} ({self.user.email or self.user.phone or self.user.username})'
