from django.urls import path

from .views import (
    DashboardSummaryView,
    AdminAccountDeleteView,
    AdminAccountListCreateView,
    InquiryInboxView,
    OrderInboxView,
    OrderStatusUpdateView,
    ProductManagementDetailView,
    ProductManagementListView,
    SubscriberInboxView,
    UserInboxView,
)
from newsletter.views import (
    NewsletterDetailView,
    NewsletterImageUploadView,
    NewsletterListCreateView,
    NewsletterSendView,
)

urlpatterns = [
    path('', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('orders/', OrderInboxView.as_view(), name='dashboard-orders'),
    path('orders/<str:reference>/status/', OrderStatusUpdateView.as_view(), name='dashboard-order-status'),
    path('products/', ProductManagementListView.as_view(), name='dashboard-products'),
    path('products/<slug:slug>/', ProductManagementDetailView.as_view(), name='dashboard-product-detail'),
    path('admins/', AdminAccountListCreateView.as_view(), name='dashboard-admins'),
    path('admins/<int:pk>/', AdminAccountDeleteView.as_view(), name='dashboard-admin-delete'),
    path('inquiries/', InquiryInboxView.as_view(), name='dashboard-inquiries'),
    path('subscribers/', SubscriberInboxView.as_view(), name='dashboard-subscribers'),
    path('newsletters/', NewsletterListCreateView.as_view(), name='dashboard-newsletters'),
    path('newsletters/<int:pk>/', NewsletterDetailView.as_view(), name='dashboard-newsletter-detail'),
    path('newsletters/<int:pk>/send/', NewsletterSendView.as_view(), name='dashboard-newsletter-send'),
    path('newsletter-images/', NewsletterImageUploadView.as_view(), name='dashboard-newsletter-image-upload'),
    path('users/', UserInboxView.as_view(), name='dashboard-users'),
]
