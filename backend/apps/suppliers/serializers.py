from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id',
            'code',
            'name',
            'phone',
            'email',
            'address',
            'stock',
            'total_purchase_amount',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'stock',
            'total_purchase_amount',
            'created_at',
        ]

    def validate_phone(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError(
                'Phone must contain only digits'
            )
        if value and len(value) > 15:
            raise serializers.ValidationError(
                'Phone must be at most 15 digits'
            )
        return value

    def validate_code(self, value):
        return value.strip().upper()

    def validate_name(self, value):
        return value.strip()