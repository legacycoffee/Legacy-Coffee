from django.urls import path

from .views import PublicNewsletterListView, SubscribeView, UnsubscribeView

urlpatterns = [
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('unsubscribe/', UnsubscribeView.as_view(), name='unsubscribe'),
    path('issues/', PublicNewsletterListView.as_view(), name='public-newsletter-issues'),
]
