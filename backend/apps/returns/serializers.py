from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers

from .models import SaleReturn, SaleReturnItem
from apps.sales.models import Sale, SaleItem


class SaleReturnItemOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleReturnItem
        fields = [
            'id',
            'barcode',
            'name',
            'quantity',
            'unit_price',
            'line_total',
        ]


class SaleReturnSerializer(serializers.ModelSerializer):
    invoice_no = serializers.CharField(write_only=True)
    barcode = serializers.CharField(write_only=True)

    staff_name = serializers.CharField(source='staff.username', read_only=True)
    items = SaleReturnItemOutputSerializer(many=True, read_only=True)

    class Meta:
        model = SaleReturn
        fields = [
            'id',
            'sale',
            'invoice_no',
            'barcode',
            'staff',
            'staff_name',
            'refund_amount',
            'created_at',
            'items',
        ]
        read_only_fields = [
            'id',
            'sale',
            'staff',
            'refund_amount',
            'created_at',
        ]

    def validate(self, attrs):
        invoice_no = attrs.get('invoice_no', '').strip()
        barcode = attrs.get('barcode', '').strip()

        try:
            sale = Sale.objects.get(invoice_no=invoice_no)
        except Sale.DoesNotExist:
            raise serializers.ValidationError({
                'invoice_no': f'No sale found with invoice "{invoice_no}"'
            })

        sale_item = SaleItem.objects.filter(
            sale=sale,
            barcode=barcode
        ).first()

        if not sale_item:
            raise serializers.ValidationError({
                'barcode': f'Barcode "{barcode}" is not part of invoice {invoice_no}'
            })

        already_returned = SaleReturnItem.objects.filter(
            sale_item=sale_item
        ).aggregate(
            total=Sum('quantity')
        )['total'] or 0

        remaining = sale_item.quantity - already_returned

        if remaining <= 0:
            raise serializers.ValidationError({
                'barcode': f'All units of "{sale_item.name}" from this sale have already been returned'
            })

        attrs['sale'] = sale
        attrs['sale_item'] = sale_item
        attrs['remaining'] = remaining

        return attrs

    def create(self, validated_data):
        sale = validated_data['sale']
        sale_item = validated_data['sale_item']
        remaining = validated_data['remaining']

        request = self.context.get('request')
        staff = request.user

        with transaction.atomic():

            sale_return = SaleReturn.objects.create(
                sale=sale,
                staff=staff
            )

            line_total = sale_item.mrp * remaining

            SaleReturnItem.objects.create(
                return_record=sale_return,
                sale_item=sale_item,
                product=sale_item.product,
                barcode=sale_item.barcode,
                name=sale_item.name,
                quantity=remaining,
                unit_price=sale_item.mrp,
                line_total=line_total
            )

            sale_return.refund_amount = line_total
            sale_return.save(update_fields=['refund_amount'])

            product = sale_item.product
            product.stock += remaining
            product.save(update_fields=['stock'])

            return sale_return