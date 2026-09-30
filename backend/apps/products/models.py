from django.db import models

from apps.categories.models import Category
from apps.suppliers.models import Supplier


class Product(models.Model):
    barcode = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products'
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name='products'
    )
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    landing_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f'{self.barcode} - {self.name}'