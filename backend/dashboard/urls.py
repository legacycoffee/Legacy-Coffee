from django.urls import path

from .views import DashboardSummaryView, InquiryInboxView, OrderInboxView

urlpatterns = [
    path('', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('orders/', OrderInboxView.as_view(), name='dashboard-orders'),
    path('inquiries/', InquiryInboxView.as_view(), name='dashboard-inquiries'),
]
