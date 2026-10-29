from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
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
        Notification.objects.create(
            user=user,
            kind=Notification.Kind.WELCOME,
            title='Welcome to Legacy Coffee',
            message='Your account is ready. You can manage your profile, delivery location, and orders here.',
        )
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
        Notification.objects.create(
            user=user,
            kind=Notification.Kind.SIGN_IN,
            title='Welcome back',
            message='You have successfully signed in to your Legacy Coffee account.',
        )
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = request.user.notifications.all()
        return Response({
            'results': [{
                'id': notification.pk,
                'kind': notification.kind,
                'title': notification.title,
                'message': notification.message,
                'details': notification.details,
                'is_read': notification.is_read,
                'created_at': notification.created_at,
            } for notification in notifications],
            'unread_count': notifications.filter(is_read=False).count(),
        })


class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        updated = request.user.notifications.filter(pk=pk, is_read=False).update(is_read=True)
        if not updated and not request.user.notifications.filter(pk=pk).exists():
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
        notification = request.user.notifications.get(pk=pk)
        return Response({
            'id': notification.pk,
            'is_read': notification.is_read,
            'unread_count': request.user.notifications.filter(is_read=False).count(),
        })


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
