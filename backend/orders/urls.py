from django.urls import path

from .views import MyOrdersView, OrderCreateView, OrderInvoiceView

urlpatterns = [
    path('mine/', MyOrdersView.as_view(), name='my-orders'),
    path('<str:reference>/invoice/', OrderInvoiceView.as_view(), name='order-invoice'),
    path('', OrderCreateView.as_view(), name='order-create'),
]
