import hashlib
from decimal import Decimal

from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import serializers

from transactions.models import Transaction
from .models import Investment


INVESTMENT_PROFILES = {
    'poupanca': {'label': 'Poupanca', 'monthly_rate': Decimal('0.45'), 'gain_probability': Decimal('0.95')},
    'renda fixa': {'label': 'Renda fixa', 'monthly_rate': Decimal('0.80'), 'gain_probability': Decimal('0.88')},
    'tesouro direto': {'label': 'Tesouro Direto', 'monthly_rate': Decimal('0.85'), 'gain_probability': Decimal('0.86')},
    'cdb': {'label': 'CDB', 'monthly_rate': Decimal('0.90'), 'gain_probability': Decimal('0.84')},
    'fundo imobiliario': {'label': 'Fundo imobiliario', 'monthly_rate': Decimal('0.95'), 'gain_probability': Decimal('0.68')},
    'acoes': {'label': 'Acoes', 'monthly_rate': Decimal('1.30'), 'gain_probability': Decimal('0.60')},
    'cripto': {'label': 'Cripto', 'monthly_rate': Decimal('2.20'), 'gain_probability': Decimal('0.54')},
    'outros': {'label': 'Outros', 'monthly_rate': Decimal('0.70'), 'gain_probability': Decimal('0.70')},
}


class InvestmentSerializer(serializers.ModelSerializer):
    expected_return_amount = serializers.SerializerMethodField()
    projected_balance = serializers.SerializerMethodField()
    monthly_gain_probability = serializers.SerializerMethodField()
    current_balance = serializers.SerializerMethodField()
    actual_return_amount = serializers.SerializerMethodField()
    actual_return_percentage = serializers.SerializerMethodField()
    performance_note = serializers.SerializerMethodField()

    class Meta:
        model = Investment
        fields = [
            'id',
            'name',
            'investment_type',
            'amount',
            'expected_return_rate',
            'expected_return_amount',
            'projected_balance',
            'monthly_gain_probability',
            'current_balance',
            'actual_return_amount',
            'actual_return_percentage',
            'performance_note',
            'start_date',
            'status',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'expected_return_rate',
            'expected_return_amount',
            'projected_balance',
            'monthly_gain_probability',
            'current_balance',
            'actual_return_amount',
            'actual_return_percentage',
            'performance_note',
            'created_at',
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('O valor aplicado precisa ser maior que zero.')

        return value

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        amount = attrs.get('amount', getattr(self.instance, 'amount', Decimal('0')))
        investment_type = attrs.get('investment_type', getattr(self.instance, 'investment_type', 'Outros'))
        attrs['expected_return_rate'] = self._profile_for_type(investment_type)['monthly_rate']

        if self.instance is None and user and amount > self._available_balance(user):
            raise serializers.ValidationError({'amount': 'Saldo insuficiente para criar este investimento.'})

        return attrs

    def create(self, validated_data):
        initial_amount = validated_data['amount']

        with db_transaction.atomic():
            investment = Investment.objects.create(**validated_data)
            Transaction.objects.create(
                user=investment.user,
                title=f'Aplicacao inicial: {investment.name}',
                transaction_type=Transaction.TransactionType.INVESTMENT,
                category='Investimentos',
                amount=initial_amount,
                date=investment.start_date,
                description='Aplicacao criada pela carteira de investimentos.',
                target_investment=investment,
            )

            return investment

    def get_expected_return_amount(self, obj):
        return obj.amount * self._profile_for_type(obj.investment_type)['monthly_rate'] / 100

    def get_projected_balance(self, obj):
        return obj.amount + self.get_expected_return_amount(obj)

    def get_monthly_gain_probability(self, obj):
        return self._profile_for_type(obj.investment_type)['gain_probability'] * 100

    def get_current_balance(self, obj):
        return self._simulate_current_balance(obj)

    def get_actual_return_amount(self, obj):
        return self.get_current_balance(obj) - obj.amount

    def get_actual_return_percentage(self, obj):
        if obj.amount <= 0:
            return Decimal('0')

        return self.get_actual_return_amount(obj) / obj.amount * 100

    def get_performance_note(self, obj):
        profile = self._profile_for_type(obj.investment_type)
        return f"Taxa mensal base de {profile['monthly_rate']}% com {profile['gain_probability'] * 100}% de chance de mes positivo."

    def _profile_for_type(self, investment_type):
        normalized = self._normalize_type(investment_type)
        return INVESTMENT_PROFILES.get(normalized, INVESTMENT_PROFILES['outros'])

    def _normalize_type(self, investment_type):
        value = str(investment_type or '').strip().lower()
        replacements = {
            'á': 'a',
            'à': 'a',
            'ã': 'a',
            'â': 'a',
            'é': 'e',
            'ê': 'e',
            'í': 'i',
            'ó': 'o',
            'ô': 'o',
            'õ': 'o',
            'ú': 'u',
            'ç': 'c',
        }

        for source, target in replacements.items():
            value = value.replace(source, target)

        return value

    def _months_elapsed(self, start_date):
        today = timezone.localdate()

        if start_date >= today:
            return 0

        months = (today.year - start_date.year) * 12 + today.month - start_date.month

        if today.day < start_date.day:
            months -= 1

        return max(0, months)

    def _simulate_current_balance(self, obj):
        profile = self._profile_for_type(obj.investment_type)
        balance = obj.amount
        months = self._months_elapsed(obj.start_date)

        for month_index in range(months):
            rate = profile['monthly_rate']

            if not self._is_positive_month(obj.id, month_index, profile['gain_probability']):
                rate = -rate

            balance += balance * rate / 100

        return balance

    def _is_positive_month(self, investment_id, month_index, probability):
        seed = f'{investment_id}:{month_index}'.encode()
        digest = hashlib.sha256(seed).hexdigest()
        roll = Decimal(int(digest[:8], 16) % 10000) / Decimal('10000')
        return roll < probability

    def _available_balance(self, user):
        balance = Decimal('0')

        for transaction in Transaction.objects.filter(user=user):
            if transaction.transaction_type == Transaction.TransactionType.INCOME:
                balance += transaction.amount
            else:
                balance -= transaction.amount

        return balance
