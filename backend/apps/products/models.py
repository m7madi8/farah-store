from django.conf import settings
from django.db import models


class Category(models.Model):
    slug = models.SlugField(max_length=100, unique=True)
    name_en = models.CharField(max_length=255)
    name_ar = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "slug"]
        indexes = [
            models.Index(fields=["is_active", "sort_order"], name="prod_cat_act_sort_idx"),
        ]

    def __str__(self):
        return self.name_en


class Product(models.Model):
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    sku = models.CharField(max_length=100, unique=True, null=True, blank=True)
    name_en = models.CharField(max_length=255, db_index=True)
    name_ar = models.CharField(max_length=255, blank=True)
    description_en = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)
    badge = models.CharField(max_length=50, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="ILS")
    stock_quantity = models.IntegerField(default=0, db_index=True)
    allow_backorder = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    categories = models.ManyToManyField("Category", through="ProductCategory", related_name="products", blank=True)

    class Meta:
        ordering = ["sort_order", "slug"]
        constraints = [
            models.CheckConstraint(check=models.Q(price__gte=0), name="products_product_price_non_neg"),
            models.CheckConstraint(check=models.Q(stock_quantity__gte=0), name="products_product_stock_non_neg"),
        ]
        indexes = [
            models.Index(fields=["is_active", "sort_order"], name="prod_prod_act_sort_idx"),
            models.Index(fields=["price", "is_active"], name="prod_prod_price_act_idx"),
        ]

    def __str__(self):
        return self.name_en


class ProductCategory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="product_category_links")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="product_links")
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["product", "category"]]
        constraints = [
            models.UniqueConstraint(
                fields=["product"],
                condition=models.Q(is_primary=True),
                name="products_productcategory_one_primary",
            ),
        ]

    def __str__(self):
        return f"{self.product.name_en} - {self.category.name_en}"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    url = models.CharField(max_length=1024)
    alt_en = models.CharField(max_length=255, blank=True)
    alt_ar = models.CharField(max_length=255, blank=True)
    sort_order = models.IntegerField(default=0)
    is_hero = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.product.name_en} image {self.id}"


class InventoryLog(models.Model):
    class Reason(models.TextChoices):
        SALE = "sale", "Sale"
        RESTOCK = "restock", "Restock"
        ADJUSTMENT = "adjustment", "Adjustment"
        RETURN = "return", "Return"
        DAMAGE = "damage", "Damage"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="inventory_logs")
    change_qty = models.IntegerField()
    quantity_after = models.IntegerField()
    reason = models.CharField(max_length=50, choices=Reason.choices)
    reference_type = models.CharField(max_length=30, blank=True)
    reference_id = models.BigIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_logs",
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(change_qty__gt=0) | models.Q(change_qty__lt=0),
                name="products_inv_change_nonzero",
            ),
        ]

    def __str__(self):
        return f"{self.product.name_en} {self.change_qty:+d} -> {self.quantity_after}"
