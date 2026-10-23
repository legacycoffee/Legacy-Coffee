from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProductViewSet, ReviewEligibilityView, ReviewListCreateView, ShareEventCreateView, WishlistView

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('reviews/eligibility/', ReviewEligibilityView.as_view(), name='review-eligibility'),
    path('share-events/', ShareEventCreateView.as_view(), name='share-event-create'),
    path('wishlist/', WishlistView.as_view(), name='wishlist'),
    path('wishlist/<slug:product_slug>/', WishlistView.as_view(), name='wishlist-detail'),
]
