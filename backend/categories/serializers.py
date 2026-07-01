from rest_framework import serializers

from transactions.utils import is_investment_category
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'icon', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_color(self, value):
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError('Informe uma cor hexadecimal valida.')

        return value

    def validate_name(self, value):
        if is_investment_category(value):
            raise serializers.ValidationError('Investimentos e um tipo de transacao, nao uma categoria.')

        return value
