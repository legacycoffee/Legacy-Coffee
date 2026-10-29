from django.urls import path

from .views import (
    LoginView,
    AdminPasswordSetupView,
    LogoutView,
    MeView,
    NotificationListView,
    NotificationReadView,
    DeleteAccountView,
    PasswordChangeView,
    ProfilePhotoUploadView,
    RegisterView,
    VerifyCurrentPasswordView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('admin-password-setup/', AdminPasswordSetupView.as_view(), name='admin-password-setup'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<uuid:public_id>/read/', NotificationReadView.as_view(), name='notification-read'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('profile-photo/', ProfilePhotoUploadView.as_view(), name='profile-photo'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),
    path('verify-password/', VerifyCurrentPasswordView.as_view(), name='verify-password'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
]
