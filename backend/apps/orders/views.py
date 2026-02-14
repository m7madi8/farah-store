from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Coupon, Order, OrderStatusHistory
from .permissions import IsOrderManager
from .serializers import (
    BankCallbackSerializer,
    CouponSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
)
from .services import create_order_from_payload, handle_bank_callback


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.prefetch_related("items", "payments", "status_history")
    serializer_class = OrderSerializer
    lookup_field = "public_id"
    lookup_value_regex = "[a-zA-Z0-9_]+"

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        if self.action in ("update_status", "list", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsOrderManager()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "update_status":
            return OrderStatusUpdateSerializer
        return OrderSerializer

    def get_queryset(self):
        qs = Order.objects.prefetch_related("items", "payments", "status_history")
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        if user.role in ("staff", "admin", "super_admin"):
            return qs
        return qs.filter(user=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        order, payment, payment_data = create_order_from_payload(serializer.validated_data, user=user)
        return Response(
            {
                "order": OrderSerializer(order).data,
                "payment": {
                    "provider": payment.provider,
                    "status": payment.status,
                    "external_id": payment.external_id,
                    "checkout_url": payment_data["checkout_url"],
                },
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, public_id=None):
        order = self.get_object()
        serializer = self.get_serializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        old_status = order.status
        serializer.save()
        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=order.status,
            changed_by=request.user,
            note="Status changed via API",
        )
        return Response(OrderSerializer(order).data)


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    lookup_field = "code"

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated(), IsOrderManager()]


@method_decorator(csrf_exempt, name="dispatch")
class BankPaymentCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = BankCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        signature = request.META.get("HTTP_X_GATEWAY_SIGNATURE", "")
        order = handle_bank_callback(serializer.validated_data, signature)
        return Response({"received": True, "order_public_id": order.public_id})
