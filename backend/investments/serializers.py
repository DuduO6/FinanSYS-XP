from rest_framework import serializers

from .models import Investment


class InvestmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investment
        fields = ['id', 'name', 'investment_type', 'amount', 'expected_return_rate', 'start_date', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('O valor aplicado precisa ser maior que zero.')

        return value
