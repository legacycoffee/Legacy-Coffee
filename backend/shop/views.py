from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Review, WishlistItem
from .services import has_completed_purchase
from .serializers import ProductSerializer, ReviewSerializer, ShareEventSerializer, WishlistItemSerializer


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Product.objects.filter(is_active=True).annotate(
            _average_rating=Avg('reviews__rating'),
            _review_count=Count('reviews'),
        ).order_by('name')

    @action(detail=True, methods=['get'], url_path='reviews')
    def reviews(self, request, slug=None):
        product = self.get_object()
        queryset = product.reviews.select_related('user')
        return Response(ReviewSerializer(queryset, many=True).data)


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Review.objects.filter(product__is_active=True).select_related('user', 'product')
        product_slug = self.request.query_params.get('product')
        if product_slug:
            queryset = queryset.filter(product__slug=product_slug)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReviewEligibilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        product = get_object_or_404(
            Product,
            slug=request.query_params.get('product'),
            is_active=True,
        )
        has_purchased = has_completed_purchase(request.user, product)
        has_reviewed = Review.objects.filter(product=product, user=request.user).exists()
        return Response({
            'has_purchased': has_purchased,
            'has_reviewed': has_reviewed,
            'can_review': has_purchased and not has_reviewed,
        })


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = WishlistItem.objects.filter(user=request.user).select_related('product')
        return Response(WishlistItemSerializer(items, many=True).data)

    def post(self, request):
        serializer = WishlistItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product=serializer.validated_data['product'],
        )
        return Response(
            WishlistItemSerializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, product_slug):
        deleted_count, _ = WishlistItem.objects.filter(
            user=request.user,
            product__slug=product_slug,
        ).delete()
        if not deleted_count:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ShareEventCreateView(generics.CreateAPIView):
    serializer_class = ShareEventSerializer
    permission_classes = [permissions.AllowAny]
