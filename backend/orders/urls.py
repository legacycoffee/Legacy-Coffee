from django.urls import path

from .views import MyOrdersView, OrderCreateView

urlpatterns = [
    path('mine/', MyOrdersView.as_view(), name='my-orders'),
    path('', OrderCreateView.as_view(), name='order-create'),
]
