from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'barcode',
        'name',
        'category',
        'supplier',
        'mrp',
        'landing_price',
        'stock',
        'created_at',
    ]
    search_fields = ['barcode', 'name', 'category__code', 'supplier__code']
    list_filter = ['category', 'supplier']