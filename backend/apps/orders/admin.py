from django.contrib import admin
from django.contrib import messages
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.dateparse import parse_date

from config.admin import admin_site

from .models import Coupon, Order, OrderItem, OrderStatusHistory, Payment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_snapshot", "unit_price_at_purchase", "total")


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ("provider", "external_id", "status", "amount", "currency", "metadata", "created_at")


class RoleProtectedAdmin(admin.ModelAdmin):
    def _can_manage(self, request):
        return request.user.is_superuser or getattr(request.user, "role", "") in ("admin", "super_admin", "staff")

    def has_module_permission(self, request):
        return self._can_manage(request)

    def has_view_permission(self, request, obj=None):
        return self._can_manage(request)

    def has_change_permission(self, request, obj=None):
        return self._can_manage(request)

    def has_add_permission(self, request):
        return self._can_manage(request)

    def has_delete_permission(self, request, obj=None):
        return self._can_manage(request)


class CouponAdmin(RoleProtectedAdmin):
    list_display = ("code", "discount_type", "discount_value", "is_active", "uses_count")
    list_filter = ("discount_type", "is_active")
    search_fields = ("code", "description")


class OrderAdmin(RoleProtectedAdmin):
    list_display = ("public_id", "customer_name", "customer_phone", "status", "total", "created_at", "quick_actions")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("public_id", "customer_name", "customer_phone", "customer_email")
    readonly_fields = ("public_id", "subtotal", "discount_amount", "tax_amount", "shipping_amount", "total")
    inlines = (OrderItemInline, PaymentInline)
    actions = ("mark_as_accepted",)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "statement/",
                self.admin_site.admin_view(self.orders_statement_view),
                name="orders_order_statement",
            ),
            path(
                "<int:order_id>/window/",
                self.admin_site.admin_view(self.order_window_view),
                name="orders_order_window",
            ),
            path(
                "<int:order_id>/invoice/",
                self.admin_site.admin_view(self.order_invoice_view),
                name="orders_order_invoice",
            ),
            path(
                "<int:order_id>/accept/",
                self.admin_site.admin_view(self.accept_order_view),
                name="orders_order_accept",
            ),
        ]
        return custom_urls + urls

    @admin.action(description="قبول الطلبات المحددة")
    def mark_as_accepted(self, request, queryset):
        updated = queryset.exclude(status__in=[Order.Status.CANCELLED, Order.Status.REFUNDED]).update(
            status=Order.Status.CONFIRMED
        )
        self.message_user(request, f"تم قبول {updated} طلب.", level=messages.SUCCESS)

    @admin.display(description="إجراءات")
    def quick_actions(self, obj):
        window_url = reverse("admin:orders_order_window", args=[obj.id])
        invoice_url = reverse("admin:orders_order_invoice", args=[obj.id])
        accept_url = reverse("admin:orders_order_accept", args=[obj.id])
        delete_url = reverse("admin:orders_order_delete", args=[obj.id])
        return format_html(
            '<div class="order-action-group">'
            '<a class="order-action-btn order-action-btn-view" href="{}">عرض</a>'
            '<a class="order-action-btn order-action-btn-open" href="{}">فاتورة</a>'
            '<a class="order-action-btn order-action-btn-accept" href="{}">قبول</a>'
            '<a class="order-action-btn order-action-btn-delete" href="{}">حذف</a>'
            "</div>",
            window_url,
            invoice_url,
            accept_url,
            delete_url,
        )

    def order_window_view(self, request, order_id):
        order = get_object_or_404(
            Order.objects.select_related("coupon", "user").prefetch_related("items__product", "payments"),
            pk=order_id,
        )
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "order": order,
            "title": f"Order {order.public_id}",
        }
        return TemplateResponse(request, "admin/orders/order_window.html", context)

    def order_invoice_view(self, request, order_id):
        order = get_object_or_404(
            Order.objects.select_related("coupon", "user").prefetch_related("items__product", "payments"),
            pk=order_id,
        )
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "order": order,
            "title": f"Invoice {order.public_id}",
            "generated_at": timezone.now(),
        }
        return TemplateResponse(request, "admin/orders/invoice_print.html", context)

    def orders_statement_view(self, request):
        orders_qs = Order.objects.select_related("user", "coupon").prefetch_related("items__product").order_by("-created_at")
        date_from = parse_date(request.GET.get("from", ""))
        date_to = parse_date(request.GET.get("to", ""))
        if date_from:
            orders_qs = orders_qs.filter(created_at__date__gte=date_from)
        if date_to:
            orders_qs = orders_qs.filter(created_at__date__lte=date_to)

        summary = orders_qs.aggregate(
            orders_count=Count("id"),
            subtotal_sum=Sum("subtotal"),
            discount_sum=Sum("discount_amount"),
            tax_sum=Sum("tax_amount"),
            shipping_sum=Sum("shipping_amount"),
            total_sum=Sum("total"),
        )
        status_counts = list(
            orders_qs.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Orders statement",
            "orders": list(orders_qs),
            "summary": summary,
            "status_counts": status_counts,
            "date_from": date_from,
            "date_to": date_to,
            "generated_at": timezone.now(),
        }
        return TemplateResponse(request, "admin/orders/orders_statement.html", context)

    def accept_order_view(self, request, order_id):
        order = get_object_or_404(Order, pk=order_id)
        if order.status not in (Order.Status.CANCELLED, Order.Status.REFUNDED):
            old_status = order.status
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=["status", "updated_at"])
            OrderStatusHistory.objects.create(
                order=order,
                from_status=old_status,
                to_status=Order.Status.CONFIRMED,
                changed_by=request.user,
                note="Order accepted from admin quick action.",
            )
            self.message_user(request, f"تم قبول الطلب {order.public_id}.", level=messages.SUCCESS)
        else:
            self.message_user(
                request,
                f"لا يمكن قبول الطلب {order.public_id} لأنه {order.get_status_display()}.",
                level=messages.WARNING,
            )
        return redirect(request.META.get("HTTP_REFERER", reverse("admin:orders_order_changelist")))


class PaymentAdmin(RoleProtectedAdmin):
    list_display = ("id", "order", "provider", "status", "amount", "currency", "created_at")
    list_filter = ("provider", "status")
    search_fields = ("order__public_id", "external_id")
    readonly_fields = ("metadata", "callback_payload")


class OrderStatusHistoryAdmin(RoleProtectedAdmin):
    list_display = ("order", "from_status", "to_status", "changed_by", "created_at")
    search_fields = ("order__public_id", "note")
    readonly_fields = ("order", "from_status", "to_status", "changed_by", "note", "created_at")


admin_site.register(Coupon, CouponAdmin)
admin_site.register(Order, OrderAdmin)
admin_site.register(Payment, PaymentAdmin)
admin_site.register(OrderStatusHistory, OrderStatusHistoryAdmin)
