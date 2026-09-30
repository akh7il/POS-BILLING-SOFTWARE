from django.db import models
from django.conf import settings

from apps.sales.models import Sale, SaleItem
from apps.products.models import Product


class SaleReturn(models.Model):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.PROTECT,
        related_name='returns'
    )
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='returns'
    )
    refund_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f'Return for {self.sale.invoice_no}'


class SaleReturnItem(models.Model):
    return_record = models.ForeignKey(
        SaleReturn,
        on_delete=models.CASCADE,
        related_name='items'
    )
    sale_item = models.ForeignKey(
        SaleItem,
        on_delete=models.PROTECT,
        related_name='return_items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT
    )
    barcode = models.CharField(max_length=50)
    name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f'{self.barcode} x {self.quantity}'