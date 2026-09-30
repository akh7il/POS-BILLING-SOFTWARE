from django.contrib import admin
from .models import Purchase, PurchaseItem


class PurchaseItemInline(admin.TabularInline):
    model = PurchaseItem
    extra = 0
    readonly_fields = [
        'product',
        'barcode',
        'name',
        'category_code',
        'quantity',
        'landing_price',
        'mrp',
        'line_total',
    ]
    can_delete = False


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number',
        'invoice_date',
        'supplier',
        'staff',
        'total_amount',
        'created_at',
    ]
    search_fields = ['invoice_number', 'supplier__code', 'supplier__name']
    list_filter = ['invoice_date', 'created_at']
    inlines = [PurchaseItemInline]