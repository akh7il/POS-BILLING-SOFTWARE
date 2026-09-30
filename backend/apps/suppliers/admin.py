from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'code',
        'name',
        'phone',
        'email',
        'stock',
        'total_purchase_amount',
        'created_at',
    ]
    search_fields = ['code', 'name', 'phone', 'email']