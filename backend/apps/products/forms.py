from django import forms

from .models import Category, Product, ProductImage


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ("slug", "name_en", "name_ar", "description", "sort_order", "is_active")


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = (
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
        )


class ProductImageForm(forms.ModelForm):
    class Meta:
        model = ProductImage
        fields = ("url", "alt_en", "alt_ar", "sort_order", "is_hero")
