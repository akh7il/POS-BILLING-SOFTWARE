from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = [
        'product',
        'barcode',
        'name',
        'quantity',
        'landing_price',
        'mrp',
        'discount',
        'payable',
    ]
    can_delete = False


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_no',
        'staff',
        'customer_phone',
        'subtotal',
        'total_discount',
        'total_payable',
        'payment_type',
        'created_at',
    ]
    search_fields = ['invoice_no', 'customer_phone', 'customer_email']
    list_filter = ['payment_type', 'created_at']
    readonly_fields = ['invoice_no', 'created_at']
    inlines = [SaleItemInline]