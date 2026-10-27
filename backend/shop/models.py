from django.conf import settings
from django.db import models


class Product(models.Model):
    slug = models.SlugField(max_length=120, primary_key=True)
    name = models.CharField(max_length=160)
    weight = models.CharField(max_length=40)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    wholesale_price = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        null=True,
        blank=True,
        help_text='Optional wholesale unit price. Leave blank to use the retail price estimate.',
    )
    description = models.TextField()
    details = models.TextField()
    tasting_notes = models.CharField(max_length=300)
    roast = models.CharField(max_length=60)
    image = models.URLField(max_length=500)
    image_alt = models.CharField(max_length=250)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()
    text = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
        constraints = [
            models.UniqueConstraint(fields=('product', 'user'), name='unique_review_per_user_product'),
            models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=5), name='review_rating_1_to_5'),
        ]

    def __str__(self):
        return f'{self.product.name}: {self.rating}/5'


class WishlistItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
        constraints = [
            models.UniqueConstraint(fields=('user', 'product'), name='unique_product_per_user_wishlist'),
        ]

    def __str__(self):
        return f'{self.user} — {self.product}'


class ShareEvent(models.Model):
    class Channel(models.TextChoices):
        WHATSAPP = 'whatsapp', 'WhatsApp'
        NATIVE = 'native', 'Native share sheet'

    product = models.ForeignKey(
        Product,
        null=True,
        on_delete=models.SET_NULL,
        related_name='share_events',
    )
    product_slug = models.SlugField(max_length=120)
    product_name = models.CharField(max_length=160)
    channel = models.CharField(max_length=20, choices=Channel.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.product_name} shared via {self.get_channel_display()}'
