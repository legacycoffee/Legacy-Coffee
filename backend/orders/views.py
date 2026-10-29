from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from rest_framework import generics, permissions
from rest_framework.views import APIView

from .invoices import build_invoice_pdf
from .models import Order, OrderItem
from .serializers import OrderCreateSerializer, OrderHistorySerializer


class OrderCreateView(generics.CreateAPIView):
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class MyOrdersView(generics.ListAPIView):
    serializer_class = OrderHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            Prefetch('items', queryset=OrderItem.objects.select_related('product')),
        )


class MyOrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'public_id'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            Prefetch('items', queryset=OrderItem.objects.select_related('product')),
        )


class OrderInvoiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reference):
        order = get_object_or_404(
            Order.objects.prefetch_related('items'),
            reference=reference,
            user=request.user,
        )
        invoice_pdf = order.invoice_pdf or build_invoice_pdf(order)
        response = HttpResponse(invoice_pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="invoice-{order.reference}.pdf"'
        response['Cache-Control'] = 'private, no-store'
        return response
