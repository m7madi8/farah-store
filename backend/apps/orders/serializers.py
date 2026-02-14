from rest_framework import serializers

from .models import Coupon, Order, OrderItem, OrderStatusHistory, Payment


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "min_order_total",
            "max_uses",
            "uses_count",
            "valid_from",
            "valid_until",
            "is_active",
        )


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("id", "product", "product_snapshot", "quantity", "unit_price_at_purchase", "total")
        read_only_fields = ("id", "product_snapshot", "unit_price_at_purchase", "total")


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("id", "provider", "external_id", "status", "amount", "currency", "metadata")
        read_only_fields = fields


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ("id", "from_status", "to_status", "changed_by", "note", "created_at")
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    payments = PaymentSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "public_id",
            "customer_name",
            "customer_phone",
            "customer_email",
            "shipping_address",
            "notes",
            "subtotal",
            "discount_amount",
            "tax_amount",
            "shipping_amount",
            "total",
            "currency",
            "status",
            "paid_at",
            "fulfilled_at",
            "items",
            "payments",
            "status_history",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "public_id",
            "subtotal",
            "discount_amount",
            "tax_amount",
            "shipping_amount",
            "total",
            "currency",
            "status",
            "paid_at",
            "fulfilled_at",
            "payments",
            "status_history",
            "created_at",
            "updated_at",
        )


class OrderCreateItemSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=255)
    customer_phone = serializers.CharField(max_length=50)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    shipping_address = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=["cod", "bank_card"])
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    items = OrderCreateItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must include at least one item.")
        return value


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status",)


class BankCallbackSerializer(serializers.Serializer):
    external_id = serializers.CharField()
    status = serializers.CharField()
