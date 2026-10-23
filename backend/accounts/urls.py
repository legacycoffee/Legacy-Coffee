from django.urls import path

from .views import (
    LoginView,
    LogoutView,
    MeView,
    DeleteAccountView,
    PasswordChangeView,
    ProfilePhotoUploadView,
    RegisterView,
    VerifyCurrentPasswordView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('profile-photo/', ProfilePhotoUploadView.as_view(), name='profile-photo'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),
    path('verify-password/', VerifyCurrentPasswordView.as_view(), name='verify-password'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
]
