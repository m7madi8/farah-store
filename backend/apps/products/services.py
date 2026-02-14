from django.db import transaction

from .models import InventoryLog, Product


@transaction.atomic
def adjust_stock(product, delta_qty, reason, user=None, reference_type="", reference_id=None, notes=""):
    if delta_qty == 0:
        raise ValueError("Stock change must not be zero.")
    product = Product.objects.select_for_update().get(pk=product.pk)
    quantity_after = product.stock_quantity + delta_qty
    if quantity_after < 0 and not product.allow_backorder:
        raise ValueError("Insufficient stock.")
    product.stock_quantity = quantity_after
    product.save(update_fields=["stock_quantity", "updated_at"])
    InventoryLog.objects.create(
        product=product,
        change_qty=delta_qty,
        quantity_after=quantity_after,
        reason=reason,
        created_by=user,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
    )
    return product
