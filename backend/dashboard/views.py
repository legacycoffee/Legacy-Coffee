from datetime import datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import filters, generics, serializers, status
from rest_framework.exceptions import APIException
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from inquiries.models import Inquiry
from newsletter.models import Subscriber
from orders.models import Order, OrderItem
from shop.models import Product, ShareEvent
from .serializers import (
    InquiryInboxSerializer,
    AdminAccountCreateSerializer,
    AdminAccountSerializer,
    OrderInboxSerializer,
    ProductManagementSerializer,
    SubscriberInboxSerializer,
    UserInboxSerializer,
)
from .models import AnonymousVisitor


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


class OrderPaymentSerializer(serializers.Serializer):
    is_paid = serializers.BooleanField()
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        required=False,
        allow_blank=True,
    )

    def validate(self, attrs):
        if attrs['is_paid'] and not attrs.get('payment_method'):
            raise serializers.ValidationError({
                'payment_method': 'Select how the payment was received.',
            })
        return attrs


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


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        start_value = request.query_params.get('start')
        end_value = request.query_params.get('end')
        start_date = parse_date(start_value) if start_value else today - timedelta(days=29)
        end_date = parse_date(end_value) if end_value else today

        if not start_date:
            raise serializers.ValidationError({'start': 'Use a valid date in YYYY-MM-DD format.'})
        if not end_date:
            raise serializers.ValidationError({'end': 'Use a valid date in YYYY-MM-DD format.'})
        if start_date > end_date:
            raise serializers.ValidationError({'end': 'End date must be on or after the start date.'})
        if (end_date - start_date).days > 365:
            raise serializers.ValidationError({'end': 'Select a date range of 366 days or fewer.'})

        start_at = timezone.make_aware(datetime.combine(start_date, time.min))
        end_at = timezone.make_aware(
            datetime.combine(end_date + timedelta(days=1), time.min),
        )
        orders = Order.objects.filter(created_at__gte=start_at, created_at__lt=end_at)
        paid_orders = orders.filter(is_paid=True)
        customer_users = get_user_model().objects.filter(
            is_staff=False,
            is_superuser=False,
            is_active=True,
        )
        period_users = customer_users.filter(date_joined__gte=start_at, date_joined__lt=end_at)
        period_active_users = customer_users.filter(
            Q(last_login__gte=start_at, last_login__lt=end_at)
            | Q(date_joined__gte=start_at, date_joined__lt=end_at),
        )
        period_new_visitors = AnonymousVisitor.objects.filter(
            is_registered=False,
            first_seen_at__gte=start_at,
            first_seen_at__lt=end_at,
        )
        period_active_visitors = AnonymousVisitor.objects.filter(
            is_registered=False,
            last_seen_at__gte=start_at,
            last_seen_at__lt=end_at,
        )

        status_rows = list(
            orders.values('status').annotate(
                count=Count('id'),
                order_value=Sum('total'),
            ).order_by('status'),
        )
        status_summary = {
            row['status']: {
                'count': row['count'],
                'order_value': row['order_value'] or Decimal('0'),
            }
            for row in status_rows
        }

        daily_orders = {
            row['day']: row
            for row in orders.annotate(day=TruncDate('created_at')).values('day').annotate(
                orders=Count('id'),
                order_value=Sum('total'),
            ).order_by('day')
        }
        daily_paid_orders = {
            row['day']: row
            for row in paid_orders.annotate(day=TruncDate('created_at')).values('day').annotate(
                paid_orders=Count('id'),
                paid_order_value=Sum('total'),
            ).order_by('day')
        }
        daily_new_users = {
            row['day']: row['count']
            for row in period_users.annotate(day=TruncDate('date_joined')).values('day').annotate(
                count=Count('id'),
            ).order_by('day')
        }
        daily_active_user_ids = {}
        for row in customer_users.filter(
            last_login__gte=start_at,
            last_login__lt=end_at,
        ).annotate(day=TruncDate('last_login')).values('id', 'day'):
            daily_active_user_ids.setdefault(row['day'], set()).add(row['id'])
        for row in period_users.annotate(day=TruncDate('date_joined')).values('id', 'day'):
            daily_active_user_ids.setdefault(row['day'], set()).add(row['id'])
        daily_active_users = {
            day: len(user_ids)
            for day, user_ids in daily_active_user_ids.items()
        }
        daily_new_visitors = {
            row['day']: row['count']
            for row in period_new_visitors.annotate(day=TruncDate('first_seen_at')).values('day').annotate(
                count=Count('visitor_id'),
            ).order_by('day')
        }
        daily_active_visitors = {
            row['day']: row['count']
            for row in period_active_visitors.annotate(day=TruncDate('last_seen_at')).values('day').annotate(
                count=Count('visitor_id'),
            ).order_by('day')
        }
        paid_order_summary = orders.filter(is_paid=True).aggregate(
            count=Count('id'),
            order_value=Sum('total'),
        )
        daily = []
        current_date = start_date
        while current_date <= end_date:
            order_data = daily_orders.get(current_date, {})
            paid_order_data = daily_paid_orders.get(current_date, {})
            daily.append({
                'date': current_date.isoformat(),
                'orders': order_data.get('orders', 0),
                'order_value': order_data.get('order_value') or Decimal('0'),
                'paid_orders': paid_order_data.get('paid_orders', 0),
                'paid_order_value': paid_order_data.get('paid_order_value') or Decimal('0'),
                'new_users': daily_new_users.get(current_date, 0),
                'new_visitors': daily_new_visitors.get(current_date, 0),
                'active_users': daily_active_users.get(current_date, 0),
                'active_visitors': daily_active_visitors.get(current_date, 0),
            })
            current_date += timedelta(days=1)

        order_value_expression = ExpressionWrapper(
            F('unit_price') * F('quantity'),
            output_field=DecimalField(max_digits=16, decimal_places=0),
        )
        product_rows = OrderItem.objects.filter(
            order__in=orders.exclude(status=Order.Status.CANCELLED),
        ).values('product_name').annotate(
            quantity_sold=Sum('quantity'),
            order_value=Sum(order_value_expression),
        ).order_by('-order_value', 'product_name')[:10]

        response = Response({
            'period': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
            'sales': {
                'order_count': orders.count(),
                'paid_order_count': paid_orders.count(),
                'paid_order_value': paid_orders.aggregate(order_value=Sum('total'))['order_value'] or Decimal('0'),
                'non_cancelled_order_value': sum(
                    (row['order_value'] for row in status_rows if row['status'] != Order.Status.CANCELLED),
                    Decimal('0'),
                ),
                'confirmed_fulfilled_order_value': sum(
                    (
                        status_summary.get(order_status, {}).get('order_value', Decimal('0'))
                        for order_status in (Order.Status.CONFIRMED, Order.Status.FULFILLED)
                    ),
                    Decimal('0'),
                ),
                'statuses': [
                    {
                        'status': order_status,
                        'count': status_summary.get(order_status, {}).get('count', 0),
                        'order_value': status_summary.get(order_status, {}).get('order_value', Decimal('0')),
                    }
                    for order_status, _ in Order.Status.choices
                ],
                'daily': daily,
                'products': list(product_rows),
            },
            'users': {
                'active_users': period_active_users.count(),
                'active_visitors': period_active_visitors.count(),
                'new_users': period_users.count(),
                'new_visitors': period_new_visitors.count(),
                'daily': daily,
            },
            'accounting': {
                'order_value_non_cancelled': sum(
                    (row['order_value'] for row in status_rows if row['status'] != Order.Status.CANCELLED),
                    Decimal('0'),
                ),
                'pending_order_value': status_summary.get(Order.Status.PENDING, {}).get('order_value', Decimal('0')),
                'confirmed_order_value': status_summary.get(Order.Status.CONFIRMED, {}).get('order_value', Decimal('0')),
                'fulfilled_order_value': status_summary.get(Order.Status.FULFILLED, {}).get('order_value', Decimal('0')),
                'cancelled_order_value': status_summary.get(Order.Status.CANCELLED, {}).get('order_value', Decimal('0')),
                'paid_order_count': paid_order_summary['count'],
                'paid_order_value': paid_order_summary['order_value'] or Decimal('0'),
                'by_status': [
                    {
                        'status': order_status,
                        'count': status_summary.get(order_status, {}).get('count', 0),
                        'order_value': status_summary.get(order_status, {}).get('order_value', Decimal('0')),
                    }
                    for order_status, _ in Order.Status.choices
                ],
            },
        })
        response['Cache-Control'] = 'no-store'
        return response


class VisitorTrackingSerializer(serializers.Serializer):
    visitor_id = serializers.UUIDField()


class VisitorTrackingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VisitorTrackingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        now = timezone.now()
        visitor, created = AnonymousVisitor.objects.get_or_create(
            visitor_id=serializer.validated_data['visitor_id'],
            defaults={
                'last_seen_at': now,
                'is_registered': request.user.is_authenticated,
            },
        )
        if not created:
            visitor.last_seen_at = now
            update_fields = ['last_seen_at']
            if request.user.is_authenticated and not visitor.is_registered:
                visitor.is_registered = True
                update_fields.append('is_registered')
            visitor.save(update_fields=update_fields)
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class OrderPaymentUpdateView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def patch(self, request, reference):
        order = get_object_or_404(
            Order.objects.select_for_update().prefetch_related('items__product'),
            reference=reference,
        )
        serializer = OrderPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_paid = serializer.validated_data['is_paid']
        payment_method = serializer.validated_data.get('payment_method', '')
        if order.status != Order.Status.FULFILLED:
            raise serializers.ValidationError({
                'is_paid': 'Only fulfilled orders can be marked as paid.',
            })

        if order.is_paid != is_paid or order.payment_method != payment_method:
            order.is_paid = is_paid
            order.payment_method = payment_method if is_paid else ''
            order.paid_at = timezone.now() if is_paid else None
            order.paid_by = request.user if is_paid else None
            order.save(update_fields=('is_paid', 'payment_method', 'paid_at', 'paid_by', 'updated_at'))
        return Response(OrderInboxSerializer(order).data, status=status.HTTP_200_OK)


class InquiryInboxView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = InquiryInboxSerializer
    queryset = Inquiry.objects.all()


class InquiryOpenView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request, pk):
        inquiry = get_object_or_404(Inquiry.objects.select_for_update(), pk=pk)
        if inquiry.status == Inquiry.Status.NEW:
            inquiry.status = Inquiry.Status.IN_PROGRESS
            inquiry.save(update_fields=('status',))
        return Response(InquiryInboxSerializer(inquiry).data, status=status.HTTP_200_OK)


class UserInboxView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = UserInboxSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['email', 'phone', 'first_name', 'last_name']

    def get_queryset(self):
        user_model = get_user_model()
        return user_model.objects.filter(is_staff=False, is_superuser=False).annotate(
            order_count=Count('orders', distinct=True),
        ).order_by('-date_joined')


class SubscriberInboxView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = SubscriberInboxSerializer
    queryset = Subscriber.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['email']


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
    def delete(self, request, public_id):
        user_model = get_user_model()
        admins = user_model.objects.select_for_update().filter(
            is_staff=True,
            is_superuser=False,
        )
        admin = get_object_or_404(admins, public_id=public_id)
        active_admins = admins.filter(is_active=True)
        if admin.is_active and active_admins.count() <= 1:
            raise LastActiveAdminConflict()
        admin.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
