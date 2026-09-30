from rest_framework import serializers
from .models import Product
from apps.categories.models import Category
from apps.suppliers.models import Supplier


class ProductSerializer(serializers.ModelSerializer):
    category_code = serializers.SerializerMethodField()
    supplier_code = serializers.SerializerMethodField()

    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )
    supplier_name = serializers.CharField(
        source='supplier.name',
        read_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'barcode',
            'name',
            'category',
            'category_code',
            'category_name',
            'supplier',
            'supplier_code',
            'supplier_name',
            'mrp',
            'landing_price',
            'stock',
            'created_at',
        ]
        read_only_fields = ['id', 'category', 'supplier', 'created_at']

    def get_category_code(self, obj):
        return obj.category.code

    def get_supplier_code(self, obj):
        return obj.supplier.code

    def validate(self, attrs):
        category_code = self.initial_data.get('category_code')
        supplier_code = self.initial_data.get('supplier_code')

        if not self.instance:
            if not category_code:
                raise serializers.ValidationError({
                    'category_code': 'Category code is required'
                })
            if not supplier_code:
                raise serializers.ValidationError({
                    'supplier_code': 'Supplier code is required'
                })

        if category_code:
            code = category_code.strip().upper()
            if not Category.objects.filter(code=code).exists():
                raise serializers.ValidationError({
                    'category_code': f'No category found with code "{code}"'
                })

        if supplier_code:
            code = supplier_code.strip().upper()
            if not Supplier.objects.filter(code=code).exists():
                raise serializers.ValidationError({
                    'supplier_code': f'No supplier found with code "{code}"'
                })

        mrp = attrs.get('mrp', getattr(self.instance, 'mrp', None))
        landing = attrs.get(
            'landing_price',
            getattr(self.instance, 'landing_price', None)
        )

        if mrp is not None and landing is not None and landing > mrp:
            raise serializers.ValidationError({
                'landing_price': 'Landing price cannot be higher than MRP'
            })

        return attrs

    def validate_barcode(self, value):
        return value.strip()

    def validate_name(self, value):
        return value.strip()

    def validate_mrp(self, value):
        if value <= 0:
            raise serializers.ValidationError('MRP must be greater than 0')
        return value

    def validate_landing_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                'Landing price must be greater than 0'
            )
        return value

    def create(self, validated_data):
        category_code = self.initial_data.get('category_code').strip().upper()
        supplier_code = self.initial_data.get('supplier_code').strip().upper()

        category = Category.objects.get(code=category_code)
        supplier = Supplier.objects.get(code=supplier_code)

        return Product.objects.create(
            category=category,
            supplier=supplier,
            **validated_data
        )

    def update(self, instance, validated_data):
        category_code = self.initial_data.get('category_code')
        supplier_code = self.initial_data.get('supplier_code')

        if category_code:
            code = category_code.strip().upper()
            instance.category = Category.objects.get(code=code)

        if supplier_code:
            code = supplier_code.strip().upper()
            instance.supplier = Supplier.objects.get(code=code)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()
        return instance