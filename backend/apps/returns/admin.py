from django.contrib import admin
from .models import SaleReturn, SaleReturnItem


class SaleReturnItemInline(admin.TabularInline):
    model = SaleReturnItem
    extra = 0
    readonly_fields = [
        'sale_item',
        'product',
        'barcode',
        'name',
        'quantity',
        'unit_price',
        'line_total',
    ]
    can_delete = False


@admin.register(SaleReturn)
class SaleReturnAdmin(admin.ModelAdmin):
    list_display = ['id', 'sale', 'staff', 'refund_amount', 'created_at']
    search_fields = ['sale__invoice_no']
    inlines = [SaleReturnItemInline]