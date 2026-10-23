from django.db.models import Prefetch
from rest_framework import generics, permissions

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
