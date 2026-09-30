from django.db import models
from django.conf import settings

from apps.suppliers.models import Supplier
from apps.products.models import Product


class Purchase(models.Model):
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField()
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name='purchases'
    )
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='purchases'
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.invoice_number


class PurchaseItem(models.Model):
    purchase = models.ForeignKey(
        Purchase,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT
    )
    barcode = models.CharField(max_length=50)
    name = models.CharField(max_length=150)
    category_code = models.CharField(max_length=20)
    quantity = models.PositiveIntegerField()
    landing_price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f'{self.barcode} x {self.quantity}'