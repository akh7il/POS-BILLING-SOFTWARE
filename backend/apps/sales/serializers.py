from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import Sale, SaleItem
from apps.products.models import Product


class SaleItemInputSerializer(serializers.Serializer):
    barcode = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)
    discount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0'),
        default=Decimal('0')
    )


class SaleItemOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = [
            'id',
            'barcode',
            'name',
            'quantity',
            'landing_price',
            'mrp',
            'discount',
            'payable',
        ]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemInputSerializer(many=True, write_only=True)
    items_read = SaleItemOutputSerializer(
        source='items',
        many=True,
        read_only=True
    )
    staff_name = serializers.CharField(
        source='staff.username',
        read_only=True
    )

    class Meta:
        model = Sale
        fields = [
            'id',
            'invoice_no',
            'staff',
            'staff_name',
            'customer_phone',
            'customer_email',
            'customer_address',
            'subtotal',
            'total_discount',
            'total_payable',
            'payment_type',
            'created_at',
            'items',
            'items_read',
        ]
        read_only_fields = [
            'id',
            'invoice_no',
            'staff',
            'subtotal',
            'total_discount',
            'total_payable',
            'created_at',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['items'] = SaleItemOutputSerializer(
            instance.items.all(), many=True
        ).data
        data.pop('items_read', None)
        return data

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                'At least one item is required'
            )
        return value

    def validate(self, attrs):
        items = attrs.get('items', [])

        barcodes = [item['barcode'].strip() for item in items]

        if len(barcodes) != len(set(barcodes)):
            raise serializers.ValidationError({
                'items': 'Duplicate barcode in items'
            })

        for item in items:
            barcode = item['barcode'].strip()

            try:
                product = Product.objects.get(barcode=barcode)
            except Product.DoesNotExist:
                raise serializers.ValidationError({
                    'items': f'No product found with barcode "{barcode}"'
                })

            if item['quantity'] > product.stock:
                raise serializers.ValidationError({
                    'items':
                        f'Not enough stock for "{product.name}". '
                        f'Available: {product.stock}, requested: {item["quantity"]}'
                })

            if item['discount'] > (product.mrp * item['quantity']):
                raise serializers.ValidationError({
                    'items':
                        f'Discount for "{product.name}" exceeds line total'
                })

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        staff = request.user

        with transaction.atomic():

            invoice_no = self._generate_invoice_no()

            sale = Sale.objects.create(
                invoice_no=invoice_no,
                staff=staff,
                **validated_data
            )

            subtotal = Decimal('0')
            total_discount = Decimal('0')
            total_payable = Decimal('0')

            for item in items_data:
                barcode = item['barcode'].strip()
                product = Product.objects.select_for_update().get(
                    barcode=barcode
                )

                quantity = item['quantity']
                discount = item['discount']
                mrp = product.mrp
                line_payable = (mrp * quantity) - discount

                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    barcode=product.barcode,
                    name=product.name,
                    quantity=quantity,
                    landing_price=product.landing_price,
                    mrp=mrp,
                    discount=discount,
                    payable=line_payable
                )

                subtotal += mrp * quantity
                total_discount += discount
                total_payable += line_payable

                product.stock -= quantity
                product.save(update_fields=['stock'])

            sale.subtotal = subtotal
            sale.total_discount = total_discount
            sale.total_payable = total_payable
            sale.save(update_fields=[
                'subtotal',
                'total_discount',
                'total_payable',
            ])

            return sale

    def _generate_invoice_no(self):
        from django.utils import timezone

        today = timezone.now().strftime('%Y%m%d')
        prefix = f'INV-{today}-'

        last = Sale.objects.filter(
            invoice_no__startswith=prefix
        ).order_by('-invoice_no').first()

        if last:
            try:
                last_number = int(last.invoice_no.split('-')[-1])
            except (ValueError, IndexError):
                last_number = 0
        else:
            last_number = 0

        return f'{prefix}{last_number + 1:04d}'