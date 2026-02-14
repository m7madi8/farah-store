from django.contrib import admin
from django.utils.html import format_html

from config.admin import admin_site

from .models import Category, InventoryLog, Product, ProductCategory, ProductImage


class CategoryListFilter(admin.SimpleListFilter):
    title = "category"
    parameter_name = "category"

    def lookups(self, request, model_admin):
        return [(c.id, c.name_en) for c in Category.objects.all()]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(product_category_links__category_id=self.value()).distinct()
        return queryset


class ProductCategoryInline(admin.TabularInline):
    model = ProductCategory
    extra = 0


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


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


class CategoryAdmin(RoleProtectedAdmin):
    list_display = ("slug", "name_en", "sort_order", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name_en", "name_ar", "slug")
    prepopulated_fields = {"slug": ("name_en",)}


class ProductAdmin(RoleProtectedAdmin):
    list_display = ("slug", "name_en", "sku", "price", "stock_display", "is_active", "created_at")
    list_filter = ("is_active", CategoryListFilter)
    search_fields = ("name_en", "name_ar", "sku", "slug")
    prepopulated_fields = {"slug": ("name_en",)}
    inlines = [ProductCategoryInline, ProductImageInline]

    @admin.display(description="Stock")
    def stock_display(self, obj):
        if obj.stock_quantity <= 0:
            return format_html('<span style="color: red;">Out (0)</span>')
        if obj.stock_quantity <= 5:
            return format_html('<span style="color: orange;">{} (low)</span>', obj.stock_quantity)
        return obj.stock_quantity


class InventoryLogAdmin(RoleProtectedAdmin):
    list_display = ("product", "change_qty", "quantity_after", "reason", "reference_type", "created_at")
    list_filter = ("reason",)
    search_fields = ("product__name_en",)
    readonly_fields = (
        "product",
        "change_qty",
        "quantity_after",
        "reason",
        "reference_type",
        "reference_id",
        "notes",
        "created_at",
        "created_by",
    )


admin_site.register(Category, CategoryAdmin)
admin_site.register(Product, ProductAdmin)
admin_site.register(InventoryLog, InventoryLogAdmin)
