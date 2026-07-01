from decimal import Decimal

from django.db import transaction as db_transaction
from rest_framework import serializers

from goals.models import Goal
from .models import Transaction
from .utils import is_investment_category


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id',
            'title',
            'transaction_type',
            'category',
            'amount',
            'date',
            'description',
            'target_goal',
            'target_investment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('O valor precisa ser maior que zero.')

        return value

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        transaction_type = attrs.get('transaction_type', getattr(self.instance, 'transaction_type', None))
        amount = attrs.get('amount', getattr(self.instance, 'amount', Decimal('0')))
        category = attrs.get('category', getattr(self.instance, 'category', ''))
        target_goal = attrs.get('target_goal')
        target_investment = attrs.get('target_investment')

        if is_investment_category(category) and transaction_type == Transaction.TransactionType.EXPENSE:
            transaction_type = Transaction.TransactionType.INVESTMENT
            attrs['transaction_type'] = transaction_type
            attrs['category'] = 'Outros'

        if transaction_type == Transaction.TransactionType.GOAL:
            if not target_goal:
                raise serializers.ValidationError({'target_goal': 'Selecione uma meta para receber o aporte.'})

            if target_goal.user != user:
                raise serializers.ValidationError({'target_goal': 'Meta invalida para este usuario.'})

            if target_goal.current_amount + amount > target_goal.target_amount:
                raise serializers.ValidationError({'amount': 'O aporte ultrapassa o valor restante da meta.'})

        if transaction_type == Transaction.TransactionType.INVESTMENT:
            if target_investment and target_investment.user != user:
                raise serializers.ValidationError({'target_investment': 'Investimento invalido para este usuario.'})

        if transaction_type == Transaction.TransactionType.GOAL:
            attrs['target_investment'] = None
        elif transaction_type == Transaction.TransactionType.INVESTMENT:
            attrs['target_goal'] = None
        else:
            attrs['target_goal'] = None
            attrs['target_investment'] = None

        if transaction_type != Transaction.TransactionType.INCOME and user and amount > self._available_balance(user):
            raise serializers.ValidationError({'amount': 'Saldo insuficiente para esta movimentacao.'})

        return attrs

    def create(self, validated_data):
        with db_transaction.atomic():
            transaction = super().create(validated_data)

            if transaction.transaction_type == Transaction.TransactionType.GOAL and transaction.target_goal:
                goal = transaction.target_goal
                goal.current_amount += transaction.amount

                if goal.current_amount >= goal.target_amount:
                    goal.status = Goal.GoalStatus.COMPLETED

                goal.save(update_fields=['current_amount', 'status', 'updated_at'])

            if transaction.transaction_type == Transaction.TransactionType.INVESTMENT and transaction.target_investment:
                investment = transaction.target_investment
                investment.amount += transaction.amount
                investment.save(update_fields=['amount'])

            return transaction

    def _available_balance(self, user):
        balance = Decimal('0')

        for transaction in Transaction.objects.filter(user=user):
            if transaction.transaction_type == Transaction.TransactionType.INCOME:
                balance += transaction.amount
            else:
                balance -= transaction.amount

        return balance
