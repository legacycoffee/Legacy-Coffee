from django.urls import path

from .views import MyOrderDetailView, MyOrdersView, OrderCreateView, OrderInvoiceView

urlpatterns = [
    path('mine/', MyOrdersView.as_view(), name='my-orders'),
    path('mine/<uuid:public_id>/', MyOrderDetailView.as_view(), name='my-order-detail'),
    path('<str:reference>/invoice/', OrderInvoiceView.as_view(), name='order-invoice'),
    path('', OrderCreateView.as_view(), name='order-create'),
]
