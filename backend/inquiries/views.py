from rest_framework import generics, permissions

from .models import Inquiry
from .serializers import InquirySerializer
from .services import send_reservation_notification


class InquiryCreateView(generics.CreateAPIView):
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        inquiry = serializer.save()
        if inquiry.kind in {
            Inquiry.Kind.FARM_RESERVATION,
            Inquiry.Kind.SEEDLING_RESERVATION,
        }:
            send_reservation_notification(inquiry)
