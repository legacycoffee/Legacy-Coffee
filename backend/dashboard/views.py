from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from inquiries.models import Inquiry
from newsletter.models import Subscriber
from orders.models import Order
from shop.models import Product
from .serializers import InquiryInboxSerializer, OrderInboxSerializer


class DashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            'products': Product.objects.count(),
            'active_products': Product.objects.filter(is_active=True).count(),
            'orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status=Order.Status.PENDING).count(),
            'inquiries': Inquiry.objects.count(),
            'new_inquiries': Inquiry.objects.filter(status=Inquiry.Status.NEW).count(),
            'active_subscribers': Subscriber.objects.filter(is_active=True).count(),
        })


class OrderInboxView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = OrderInboxSerializer
    queryset = Order.objects.prefetch_related('items').all()


class InquiryInboxView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = InquiryInboxSerializer
    queryset = Inquiry.objects.all()
