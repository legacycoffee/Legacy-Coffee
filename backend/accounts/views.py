from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    LoginSerializer,
    CurrentPasswordSerializer,
    DeleteAccountSerializer,
    PasswordChangeSerializer,
    RegistrationSerializer,
    UserSerializer,
)
from .services import upload_profile_photo


class RegisterView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfilePhotoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        photo = request.data.get('photo')
        if photo is None:
            return Response(
                {'photo': 'Choose a profile photo to upload.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.profile_photo = upload_profile_photo(photo, request.user.pk)
        request.user.save(update_fields=('profile_photo',))
        return Response(UserSerializer(request.user).data)


class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password changed successfully.'})


class VerifyCurrentPasswordView(generics.GenericAPIView):
    serializer_class = CurrentPasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'detail': 'Current password verified.'})


class DeleteAccountView(generics.GenericAPIView):
    serializer_class = DeleteAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from orders.models import Order

        if Order.objects.filter(user=request.user).exists():
            return Response(
                {'detail': 'This account cannot be deleted while it has order history. Please contact support for help.'},
                status=status.HTTP_409_CONFLICT,
            )

        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
