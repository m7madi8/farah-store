import uuid
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.products.models import Product
from apps.products.services import adjust_stock

from .models import Coupon, Order, OrderItem, OrderStatusHistory, Payment
from .payment_gateways import MockBankGatewayAdapter


def _apply_coupon(coupon_code, subtotal):
    if not coupon_code:
        return None, Decimal("0.00")
    try:
        coupon = Coupon.objects.get(code=coupon_code)
    except Coupon.DoesNotExist as exc:
        raise ValidationError({"coupon_code": "Invalid coupon code."}) from exc
    if not coupon.is_active:
        raise ValidationError({"coupon_code": "Coupon is not active."})
    now = timezone.now()
    if coupon.valid_from and now < coupon.valid_from:
        raise ValidationError({"coupon_code": "Coupon is not yet active."})
    if coupon.valid_until and now > coupon.valid_until:
        raise ValidationError({"coupon_code": "Coupon has expired."})
    if coupon.max_uses is not None and coupon.uses_count >= coupon.max_uses:
        raise ValidationError({"coupon_code": "Coupon usage limit reached."})
    if subtotal < coupon.min_order_total:
        raise ValidationError({"coupon_code": f"Minimum order is {coupon.min_order_total}."})
    if coupon.discount_type == Coupon.DiscountType.PERCENT:
        discount = (subtotal * coupon.discount_value / 100).quantize(Decimal("0.01"))
    else:
        discount = min(coupon.discount_value, subtotal)
    return coupon, discount


def _compute_totals(subtotal, discount):
    tax_rate = Decimal(str(getattr(settings, "CHECKOUT_TAX_RATE", 0) or 0))
    shipping = Decimal(str(getattr(settings, "CHECKOUT_SHIPPING_FIXED", 0) or 0)).quantize(Decimal("0.01"))
    tax = ((subtotal - discount) * tax_rate).quantize(Decimal("0.01"))
    total = (subtotal - discount + tax + shipping).quantize(Decimal("0.01"))
    return tax, shipping, total


@transaction.atomic
def create_order_from_payload(validated_data, user=None):
    items = validated_data.pop("items")
    payment_method = validated_data.pop("payment_method")
    coupon_code = validated_data.pop("coupon_code", "")

    validated_items = []
    subtotal = Decimal("0.00")
    for item in items:
        product = Product.objects.select_for_update().filter(pk=item["product"]).first()
        if not product or not product.is_active:
            raise ValidationError({"items": "Some products are invalid or inactive."})
        quantity = int(item["quantity"])
        if quantity < 1:
            raise ValidationError({"items": "Quantity must be >= 1."})
        if not product.allow_backorder and product.stock_quantity < quantity:
            raise ValidationError({"items": f"Insufficient stock for {product.name_en}."})
        unit_price = (
            product.discount_price
            if product.discount_price is not None and product.discount_price < product.price
            else product.price
        )
        line_total = unit_price * quantity
        subtotal += line_total
        validated_items.append(
            {
                "product": product,
                "quantity": quantity,
                "unit_price_at_purchase": unit_price,
                "total": line_total,
            }
        )

    coupon, discount_amount = _apply_coupon(coupon_code, subtotal)
    tax_amount, shipping_amount, total = _compute_totals(subtotal, discount_amount)

    order = Order.objects.create(
        public_id=f"ord_{uuid.uuid4().hex[:12]}",
        user=user if user and user.is_authenticated else None,
        customer_name=validated_data["customer_name"],
        customer_phone=validated_data["customer_phone"],
        customer_email=validated_data.get("customer_email", ""),
        shipping_address=validated_data["shipping_address"],
        notes=validated_data.get("notes", ""),
        subtotal=subtotal,
        discount_amount=discount_amount,
        tax_amount=tax_amount,
        shipping_amount=shipping_amount,
        total=total,
        coupon=coupon,
        status=Order.Status.PENDING,
    )

    for item in validated_items:
        OrderItem.objects.create(
            order=order,
            product=item["product"],
            product_snapshot={
                "name_en": item["product"].name_en,
                "name_ar": item["product"].name_ar,
                "sku": item["product"].sku,
            },
            quantity=item["quantity"],
            unit_price_at_purchase=item["unit_price_at_purchase"],
            total=item["total"],
        )

    if coupon:
        coupon.uses_count += 1
        coupon.save(update_fields=["uses_count", "updated_at"])

    payment = Payment.objects.create(
        order=order,
        provider=Payment.Provider.COD if payment_method == "cod" else Payment.Provider.BANK_CARD,
        amount=order.total,
        currency=order.currency,
        status=Payment.Status.PENDING,
    )
    payment_data = {"checkout_url": None}
    if payment_method == "bank_card":
        gateway = MockBankGatewayAdapter()
        result = gateway.initialize_card_payment(order.total, order.currency, order.public_id)
        payment.external_id = result.external_id
        payment.metadata = {"gateway": "mock_bank"}
        payment.save(update_fields=["external_id", "metadata", "updated_at"])
        payment_data["checkout_url"] = result.checkout_url

    if payment_method == "cod":
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["status", "updated_at"])
        OrderStatusHistory.objects.create(
            order=order,
            from_status=Order.Status.PENDING,
            to_status=Order.Status.CONFIRMED,
            changed_by=user if user and user.is_authenticated else None,
            note="COD order confirmed at creation.",
        )
        for item in validated_items:
            adjust_stock(
                item["product"],
                -item["quantity"],
                reason="sale",
                user=user if user and user.is_authenticated else None,
                reference_type="order",
                reference_id=order.id,
                notes=f"Stock deducted for COD order {order.public_id}",
            )

    return order, payment, payment_data


@transaction.atomic
def handle_bank_callback(payload, signature):
    gateway = MockBankGatewayAdapter()
    if not gateway.verify_callback(payload, signature):
        raise ValidationError({"detail": "Invalid callback signature."})
    data = gateway.parse_callback(payload)
    payment = Payment.objects.select_for_update().select_related("order").filter(external_id=data["external_id"]).first()
    if not payment:
        raise ValidationError({"detail": "Payment not found."})
    if payment.status == Payment.Status.CAPTURED:
        return payment.order

    payment.status = Payment.Status.CAPTURED
    payment.callback_verified = True
    payment.callback_payload = data.get("raw", {})
    payment.callback_received_at = timezone.now()
    payment.save(
        update_fields=["status", "callback_verified", "callback_payload", "callback_received_at", "updated_at"]
    )

    order = payment.order
    old_status = order.status
    order.status = Order.Status.PAID
    order.paid_at = timezone.now()
    order.save(update_fields=["status", "paid_at", "updated_at"])
    OrderStatusHistory.objects.create(order=order, from_status=old_status, to_status=Order.Status.PAID, note="Bank callback captured.")

    for item in order.items.select_related("product"):
        if not item.product_id:
            continue
        adjust_stock(
            item.product,
            -item.quantity,
            reason="sale",
            reference_type="order",
            reference_id=order.id,
            notes=f"Stock deducted after bank capture for {order.public_id}",
        )
    return order
