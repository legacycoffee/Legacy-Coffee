from django.db import models
from rest_framework import serializers

from .services import has_completed_purchase
from .models import Product, Review, ShareEvent, WishlistItem


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='slug', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'weight', 'price', 'description', 'details',
            'tasting_notes', 'roast', 'image', 'image_alt', 'average_rating',
            'review_count',
        )

    def get_average_rating(self, product):
        return getattr(product, '_average_rating', None)

    def get_review_count(self, product):
        if hasattr(product, '_review_count'):
            return product._review_count
        return product.reviews.count()


class ReviewSerializer(serializers.ModelSerializer):
    product = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=Product.objects.filter(is_active=True),
    )
    reviewer = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'product', 'reviewer', 'rating', 'text', 'created_at')
        read_only_fields = ('id', 'reviewer', 'created_at')

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be from 1 to 5.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if Review.objects.filter(product=attrs['product'], user=request.user).exists():
                raise serializers.ValidationError('You have already reviewed this product.')
            if not has_completed_purchase(request.user, attrs['product']):
                raise serializers.ValidationError('You can review this product after an order containing it has been fulfilled.')
        return attrs


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.SlugRelatedField(
        source='product',
        slug_field='slug',
        queryset=Product.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = WishlistItem
        fields = ('id', 'product', 'product_id', 'created_at')
        read_only_fields = ('id', 'product', 'created_at')


class ShareEventSerializer(serializers.ModelSerializer):
    product_id = serializers.SlugRelatedField(
        source='product',
        slug_field='slug',
        queryset=Product.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = ShareEvent
        fields = ('id', 'product_id', 'channel', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        product = validated_data['product']
        return ShareEvent.objects.create(
            product=product,
            product_slug=product.slug,
            product_name=product.name,
            channel=validated_data['channel'],
        )
