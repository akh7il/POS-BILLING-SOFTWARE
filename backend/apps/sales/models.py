from django.db import models
from django.conf import settings

from apps.products.models import Product


class Sale(models.Model):

    class PaymentType(models.TextChoices):
        CASH = 'CASH', 'Cash'
        CARD = 'CARD', 'Card'
        UPI = 'UPI', 'UPI'

    invoice_no = models.CharField(max_length=30, unique=True)
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sales'
    )

    customer_phone = models.CharField(max_length=15, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_address = models.TextField(blank=True)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    payment_type = models.CharField(
        max_length=10,
        choices=PaymentType.choices
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.invoice_no


class SaleItem(models.Model):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT
    )

    barcode = models.CharField(max_length=50)
    name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField()
    landing_price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payable = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f'{self.barcode} x {self.quantity}'