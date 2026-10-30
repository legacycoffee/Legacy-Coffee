from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from accounts.models import User
from accounts.services import upload_product_image
from inquiries.models import Inquiry
from newsletter.models import Subscriber
from orders.models import Order
from shop.models import Product


class OrderInboxItemSerializer(serializers.Serializer):
    product_name = serializers.CharField()
    weight = serializers.CharField()
    product_image = serializers.SerializerMethodField()
    product_image_alt = serializers.SerializerMethodField()
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=0)
    quantity = serializers.IntegerField()
    is_wholesale = serializers.BooleanField()
    line_total = serializers.DecimalField(max_digits=14, decimal_places=0)

    def get_product_image(self, item):
        return item.product.image if item.product else None

    def get_product_image_alt(self, item):
        return item.product.image_alt if item.product else item.product_name


class OrderInboxSerializer(serializers.ModelSerializer):
    items = OrderInboxItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'reference', 'customer_name', 'business_name', 'customer_email', 'customer_phone',
            'delivery_address', 'delivery_city', 'delivery_notes',
            'delivery_latitude', 'delivery_longitude', 'status',
            'is_paid', 'payment_method', 'paid_at', 'total', 'items', 'created_at',
        )


class InquiryInboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = (
            'id', 'kind', 'name', 'email', 'phone', 'business_name',
            'product', 'quantity', 'subject', 'message', 'status', 'created_at',
        )


class UserInboxSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='public_id', read_only=True)
    name = serializers.SerializerMethodField()
    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'phone', 'date_joined', 'last_login', 'order_count', 'is_active')

    def get_name(self, user):
        return (
            ' '.join(part for part in (user.first_name, user.last_name) if part)
            or user.email
            or user.phone
            or user.username
        )


class SubscriberInboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ('id', 'email', 'is_active', 'subscribed_at', 'unsubscribed_at')


class ProductManagementSerializer(serializers.ModelSerializer):
    image = serializers.URLField(required=False)
    coffee_type = serializers.ChoiceField(choices=Product.CoffeeType.choices, required=True)

    class Meta:
        model = Product
        fields = (
            'slug', 'name', 'coffee_type', 'weight', 'price', 'wholesale_price', 'description',
            'details', 'tasting_notes', 'roast', 'image', 'image_alt', 'is_active',
        )

    def validate(self, attrs):
        request = self.context.get('request')
        image_upload = request and request.FILES.get('image')
        if not self.instance and not image_upload and not attrs.get('image'):
            raise serializers.ValidationError({'image': 'Upload an image for this product.'})
        return attrs

    def to_internal_value(self, data):
        data = data.copy()
        request = self.context.get('request')
        if request and request.FILES.get('image'):
            data.pop('image', None)
        if data.get('wholesale_price') == '':
            data['wholesale_price'] = None
        return super().to_internal_value(data)

    def validate_slug(self, value):
        if self.instance and value != self.instance.slug:
            raise serializers.ValidationError('The product URL slug cannot be changed after creation.')
        return value

    def create(self, validated_data):
        image_upload = self.context['request'].FILES.get('image')
        if image_upload:
            validated_data['image'] = upload_product_image(image_upload, validated_data['slug'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image_upload = self.context['request'].FILES.get('image')
        if image_upload:
            validated_data['image'] = upload_product_image(image_upload, instance.slug)
        return super().update(instance, validated_data)


class AdminAccountSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='public_id', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_active', 'date_joined', 'last_login')
        read_only_fields = fields


class AdminAccountCreateSerializer(serializers.Serializer):
    id = serializers.UUIDField(source='public_id', read_only=True)
    username = serializers.CharField(
        max_length=150,
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_staff=True,
            must_change_password=True,
        )
