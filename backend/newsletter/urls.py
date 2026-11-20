from django.urls import path

from .views import PublicNewsletterListView, SubscribeView, SubstackPostsView, UnsubscribeView

urlpatterns = [
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('unsubscribe/', UnsubscribeView.as_view(), name='unsubscribe'),
    path('issues/', PublicNewsletterListView.as_view(), name='public-newsletter-issues'),
    path('substack-posts/', SubstackPostsView.as_view(), name='substack-posts'),
]
