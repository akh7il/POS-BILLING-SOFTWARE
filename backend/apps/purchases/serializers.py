from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import Purchase, PurchaseItem
from apps.suppliers.models import Supplier
from apps.categories.models import Category
from apps.products.models import Product


class PurchaseItemInputSerializer(serializers.Serializer):
    barcode = serializers.CharField()
    name = serializers.CharField()
    category_code = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)
    landing_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01')
    )
    mrp = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01')
    )

    def validate_barcode(self, value):
        return value.strip()

    def validate_name(self, value):
        return value.strip()

    def validate_category_code(self, value):
        return value.strip().upper()

    def validate(self, attrs):
        landing = attrs.get('landing_price')
        mrp = attrs.get('mrp')

        if landing and mrp and landing > mrp:
            raise serializers.ValidationError(
                'Landing price cannot be higher than MRP'
            )

        code = attrs.get('category_code')
        if code and not Category.objects.filter(code=code).exists():
            raise serializers.ValidationError({
                'category_code': f'No category found with code "{code}"'
            })

        return attrs


class PurchaseItemOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseItem
        fields = [
            'id',
            'barcode',
            'name',
            'category_code',
            'quantity',
            'landing_price',
            'mrp',
            'line_total',
        ]


class PurchaseSerializer(serializers.ModelSerializer):
    supplier_code = serializers.CharField(write_only=True)
    items = PurchaseItemInputSerializer(many=True, write_only=True)

    supplier_name = serializers.CharField(
        source='supplier.name',
        read_only=True
    )
    staff_name = serializers.CharField(
        source='staff.username',
        read_only=True
    )

    class Meta:
        model = Purchase
        fields = [
            'id',
            'invoice_number',
            'invoice_date',
            'supplier',
            'supplier_code',
            'supplier_name',
            'staff',
            'staff_name',
            'total_amount',
            'created_at',
            'items',
        ]
        read_only_fields = [
            'id',
            'supplier',
            'staff',
            'total_amount',
            'created_at',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['items'] = PurchaseItemOutputSerializer(
            instance.items.all(), many=True
        ).data
        data['supplier_code'] = instance.supplier.code
        return data

    def validate_supplier_code(self, value):
        code = value.strip().upper()
        if not Supplier.objects.filter(code=code).exists():
            raise serializers.ValidationError(
                f'No supplier found with code "{code}"'
            )
        return code

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                'At least one item is required'
            )
        return value

    def validate_invoice_number(self, value):
        return value.strip()

    def create(self, validated_data):
        supplier_code = validated_data.pop('supplier_code')
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        staff = request.user

        with transaction.atomic():

            supplier = Supplier.objects.select_for_update().get(
                code=supplier_code
            )

            purchase = Purchase.objects.create(
                supplier=supplier,
                staff=staff,
                **validated_data
            )

            total_amount = Decimal('0')
            total_quantity = 0

            for item in items_data:
                barcode = item['barcode']
                quantity = item['quantity']
                landing = item['landing_price']
                mrp = item['mrp']

                category = Category.objects.get(
                    code=item['category_code']
                )

                try:
                    product = Product.objects.select_for_update().get(
                        barcode=barcode
                    )
                    product.stock += quantity
                    product.landing_price = landing
                    product.mrp = mrp
                    product.save(update_fields=[
                        'stock',
                        'landing_price',
                        'mrp'
                    ])
                except Product.DoesNotExist:
                    product = Product.objects.create(
                        barcode=barcode,
                        name=item['name'],
                        category=category,
                        supplier=supplier,
                        landing_price=landing,
                        mrp=mrp,
                        stock=quantity
                    )

                line_total = landing * quantity

                PurchaseItem.objects.create(
                    purchase=purchase,
                    product=product,
                    barcode=barcode,
                    name=item['name'],
                    category_code=item['category_code'],
                    quantity=quantity,
                    landing_price=landing,
                    mrp=mrp,
                    line_total=line_total
                )

                total_amount += line_total
                total_quantity += quantity

            purchase.total_amount = total_amount
            purchase.save(update_fields=['total_amount'])

            supplier.stock += total_quantity
            supplier.total_purchase_amount += total_amount
            supplier.save(update_fields=[
                'stock',
                'total_purchase_amount'
            ])

            return purchase