from rest_framework import serializers

from .models import Goal


class GoalSerializer(serializers.ModelSerializer):
    progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = Goal
        fields = [
            'id',
            'title',
            'target_amount',
            'current_amount',
            'deadline',
            'status',
            'description',
            'progress',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'progress', 'created_at', 'updated_at']

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('O valor alvo precisa ser maior que zero.')

        return value

    def validate_current_amount(self, value):
        if value < 0:
            raise serializers.ValidationError('O valor atual nao pode ser negativo.')

        return value

    def validate(self, attrs):
        target_amount = attrs.get('target_amount', getattr(self.instance, 'target_amount', None))
        current_amount = attrs.get('current_amount', getattr(self.instance, 'current_amount', 0))

        if target_amount is not None and current_amount > target_amount:
            raise serializers.ValidationError({'current_amount': 'O valor atual nao pode passar do valor alvo.'})

        return attrs
