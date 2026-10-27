from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, serializers, status
from rest_framework.exceptions import APIException
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from inquiries.models import Inquiry
from newsletter.models import Subscriber
from orders.models import Order
from shop.models import Product, ShareEvent
from .serializers import (
    InquiryInboxSerializer,
    AdminAccountCreateSerializer,
    AdminAccountSerializer,
    OrderInboxSerializer,
    ProductManagementSerializer,
    UserInboxSerializer,
)


ORDER_STATUS_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.CONFIRMED, Order.Status.CANCELLED},
    Order.Status.CONFIRMED: {Order.Status.PENDING, Order.Status.FULFILLED, Order.Status.CANCELLED},
    Order.Status.FULFILLED: set(),
    Order.Status.CANCELLED: {Order.Status.PENDING},
}

class ProductDeletionConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = {'detail': 'This product has customer reviews and cannot be deleted. Unpublish it instead.'}
    default_code = 'product_has_reviews'


class LastActiveAdminConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = {'detail': 'At least one active administrator must remain.'}
    default_code = 'last_active_admin'


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)

    def validate_status(self, value):
        current_status = self.instance.status
        if value == current_status:
            return value
        if value not in ORDER_STATUS_TRANSITIONS[current_status]:
            raise serializers.ValidationError(
                f'An order cannot move from {current_status} to {value}.',
            )
        return value


class DashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            'products': Product.objects.count(),
            'active_products': Product.objects.filter(is_active=True).count(),
            'users': get_user_model().objects.filter(is_staff=False, is_superuser=False).count(),
            'orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status=Order.Status.PENDING).count(),
            'inquiries': Inquiry.objects.count(),
            'new_inquiries': Inquiry.objects.filter(status=Inquiry.Status.NEW).count(),
            'active_subscribers': Subscriber.objects.filter(is_active=True).count(),
            'product_shares': ShareEvent.objects.count(),
        })


class OrderInboxView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = OrderInboxSerializer
    queryset = Order.objects.prefetch_related('items__product').all()


class OrderStatusUpdateView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def patch(self, request, reference):
        order = get_object_or_404(
            Order.objects.select_for_update().prefetch_related('items__product'),
            reference=reference,
        )
        serializer = OrderStatusSerializer(order, data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data['status'] != order.status:
            order.status = serializer.validated_data['status']
            order.save(update_fields=('status', 'updated_at'))
        return Response(OrderInboxSerializer(order).data, status=status.HTTP_200_OK)


class InquiryInboxView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = InquiryInboxSerializer
    queryset = Inquiry.objects.all()


class UserInboxView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = UserInboxSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['email', 'first_name', 'last_name']

    def get_queryset(self):
        user_model = get_user_model()
        return user_model.objects.filter(is_staff=False, is_superuser=False).annotate(
            order_count=Count('orders', distinct=True),
        ).order_by('-date_joined')


class ProductManagementListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = ProductManagementSerializer
    queryset = Product.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'slug', 'roast']
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class ProductManagementDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = ProductManagementSerializer
    queryset = Product.objects.all()
    lookup_field = 'slug'
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def perform_destroy(self, instance):
        if instance.reviews.exists():
            raise ProductDeletionConflict()
        instance.delete()


class AdminAccountListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = get_user_model().objects.filter(is_staff=True, is_superuser=False).order_by('email')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminAccountCreateSerializer
        return AdminAccountSerializer


class AdminAccountDeleteView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def delete(self, request, pk):
        user_model = get_user_model()
        admins = user_model.objects.select_for_update().filter(
            is_staff=True,
            is_superuser=False,
        )
        admin = get_object_or_404(admins, pk=pk)
        active_admins = admins.filter(is_active=True)
        if admin.is_active and active_admins.count() <= 1:
            raise LastActiveAdminConflict()
        admin.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
