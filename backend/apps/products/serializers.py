from rest_framework import serializers

from .models import Category, InventoryLog, Product, ProductCategory, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "slug", "name_en", "name_ar", "description", "sort_order", "is_active")


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "url", "alt_en", "alt_ar", "sort_order", "is_hero")


class ProductCategoryLinkSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = ProductCategory
        fields = ("id", "category", "is_primary", "created_at")


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    categories = ProductCategoryLinkSerializer(source="product_category_links", many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "sku",
            "name_en",
            "name_ar",
            "description_en",
            "description_ar",
            "badge",
            "price",
            "discount_price",
            "currency",
            "stock_quantity",
            "allow_backorder",
            "sort_order",
            "is_active",
            "images",
            "categories",
            "created_at",
            "updated_at",
        )


class ProductListSerializer(serializers.ModelSerializer):
    hero_image = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "name_en",
            "name_ar",
            "description_en",
            "description_ar",
            "price",
            "discount_price",
            "currency",
            "stock_quantity",
            "is_active",
            "hero_image",
            "category",
            "sort_order",
        )

    def get_hero_image(self, obj):
        hero = obj.images.filter(is_hero=True).first()
        return ProductImageSerializer(hero).data if hero else None

    def get_category(self, obj):
        link = obj.product_category_links.order_by("-is_primary").first()
        return link.category.slug if link else None


class InventoryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryLog
        fields = (
            "id",
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
