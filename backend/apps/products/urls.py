from django.urls import path

from .views import CategoryViewSet, InventoryLogViewSet, ProductViewSet

app_name = "products"

urlpatterns = [
    path("", ProductViewSet.as_view({"get": "list", "post": "create"}), name="product-list"),
    path("<slug:slug>/", ProductViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}), name="product-detail"),
    path("categories/", CategoryViewSet.as_view({"get": "list", "post": "create"}), name="category-list"),
    path("categories/<slug:slug>/", CategoryViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}), name="category-detail"),
    path("inventory-logs/", InventoryLogViewSet.as_view({"get": "list"}), name="inventory-log-list"),
]
