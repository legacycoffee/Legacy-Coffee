from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from urllib.parse import urlparse

from .models import User


class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.URLField(required=False, allow_blank=True, max_length=500)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'phone', 'first_name', 'last_name',
            'delivery_address', 'delivery_city', 'delivery_notes',
            'location_latitude', 'location_longitude', 'profile_photo',
            'is_staff',
        )
        read_only_fields = ('id', 'username', 'email', 'phone', 'is_staff')

    def validate_profile_photo(self, value):
        if value and urlparse(value).hostname != 'res.cloudinary.com':
            raise serializers.ValidationError('Profile photos must be stored in Cloudinary.')
        return value


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['current_password']):
            raise serializers.ValidationError({'current_password': 'Your current password is incorrect.'})
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'The new passwords do not match.'})
        validate_password(attrs['new_password'], user)
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=('password',))
        return user


class CurrentPasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Your current password is incorrect.')
        return value


class DeleteAccountSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Your current password is incorrect.')
        return value


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(
        max_length=40,
        validators=[UniqueValidator(queryset=User.objects.all())],
    )

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'phone', 'password', 'confirm_password',
            'first_name', 'last_name',
            'delivery_address', 'delivery_city', 'delivery_notes',
            'location_latitude', 'location_longitude',
        )
        read_only_fields = ('id',)

    def validate_email(self, value):
        if not value:
            return None
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'The passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data['email'] = validated_data.get('email') or None
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        identifier = attrs['email'].strip()
        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(phone=identifier),
        ).first()
        if user is None or not user.check_password(attrs['password']):
            raise serializers.ValidationError('Invalid email or phone number or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account is inactive.')
        attrs['user'] = user
        return attrs


class AdminPasswordSetupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    temporary_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = User.objects.select_for_update().filter(
            email__iexact=attrs['email'],
            is_active=True,
        ).first()
        if (
            user is None
            or not user.is_staff
            or not user.must_change_password
            or not user.check_password(attrs['temporary_password'])
        ):
            raise serializers.ValidationError({
                'temporary_password': 'The administrator email or temporary password is incorrect.',
            })
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'The new passwords do not match.',
            })
        if attrs['new_password'] == attrs['temporary_password']:
            raise serializers.ValidationError({
                'new_password': 'Choose a password different from your temporary password.',
            })
        validate_password(attrs['new_password'], user)
        attrs['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.must_change_password = False
        user.save(update_fields=('password', 'must_change_password'))
        return user
