from django import forms

from .models import Coupon, Order


class CouponForm(forms.ModelForm):
    class Meta:
        model = Coupon
        fields = (
            "code",
            "description",
            "discount_type",
            "discount_value",
            "min_order_total",
            "max_uses",
            "valid_from",
            "valid_until",
            "is_active",
        )


class OrderAdminStatusForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = ("status", "notes")
