from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Category, InventoryLog, Product
from .permissions import IsStaffOrReadOnly
from .serializers import (
    CategorySerializer,
    InventoryLogSerializer,
    ProductListSerializer,
    ProductSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ["sort_order", "slug", "created_at"]
    search_fields = ["slug", "name_en", "name_ar"]

    def get_queryset(self):
        qs = Category.objects.all()
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            qs = qs.filter(is_active=True)
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.prefetch_related("images", "product_category_links__category")
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["is_active", "allow_backorder", "currency"]
    ordering_fields = ["sort_order", "price", "stock_quantity", "created_at"]
    search_fields = ["slug", "sku", "name_en", "name_ar", "description_en", "description_ar"]

    def get_queryset(self):
        qs = Product.objects.prefetch_related("images", "product_category_links__category")
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer


class InventoryLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryLog.objects.select_related("product", "created_by")
    serializer_class = InventoryLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["product", "reason", "created_by"]
    ordering_fields = ["created_at"]
