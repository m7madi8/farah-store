from django.urls import path

from .views import BankPaymentCallbackView, CouponViewSet, OrderViewSet

app_name = "orders"

urlpatterns = [
    path("", OrderViewSet.as_view({"get": "list", "post": "create"}), name="order-list"),
    path("<str:public_id>/", OrderViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}), name="order-detail"),
    path("<str:public_id>/status/", OrderViewSet.as_view({"patch": "update_status"}), name="order-status"),
    path("coupons/", CouponViewSet.as_view({"get": "list", "post": "create"}), name="coupon-list"),
    path("coupons/<str:code>/", CouponViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}), name="coupon-detail"),
    path("payments/bank/callback/", BankPaymentCallbackView.as_view(), name="bank-callback"),
]
