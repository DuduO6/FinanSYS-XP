from decimal import Decimal

from rest_framework.response import Response
from rest_framework.views import APIView

from transactions.models import Transaction
from transactions.serializers import TransactionSerializer


class DashboardView(APIView):
    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        income = sum((transaction.amount for transaction in transactions if transaction.transaction_type == Transaction.TransactionType.INCOME), Decimal('0'))
        expenses = sum((transaction.amount for transaction in transactions if transaction.transaction_type == Transaction.TransactionType.EXPENSE), Decimal('0'))
        expenses_by_category = {}
        monthly_evolution = {}

        for transaction in transactions:
            month = transaction.date.strftime('%Y-%m')
            monthly_evolution.setdefault(month, {'income': Decimal('0'), 'expenses': Decimal('0')})

            if transaction.transaction_type == Transaction.TransactionType.INCOME:
                monthly_evolution[month]['income'] += transaction.amount
            else:
                monthly_evolution[month]['expenses'] += transaction.amount
                expenses_by_category[transaction.category] = expenses_by_category.get(transaction.category, Decimal('0')) + transaction.amount

        recent_transactions = transactions[:5]
        total_transactions = transactions.count()
        xp = total_transactions * 20
        level = max(1, xp // 200 + 1)
        next_level_xp = level * 200
        current_level_start = (level - 1) * 200
        progress = 0

        if next_level_xp > current_level_start:
            progress = int(((xp - current_level_start) / (next_level_xp - current_level_start)) * 100)

        return Response(
            {
                'summary': {
                    'income': income,
                    'expenses': expenses,
                    'balance': income - expenses,
                },
                'expenses_by_category': [
                    {'category': category, 'amount': amount}
                    for category, amount in sorted(expenses_by_category.items())
                ],
                'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
                'monthly_evolution': [
                    {'month': month, **values}
                    for month, values in sorted(monthly_evolution.items())
                ],
                'gamification': {
                    'xp': xp,
                    'level': level,
                    'next_level_xp': next_level_xp,
                    'progress': progress,
                },
            }
        )
