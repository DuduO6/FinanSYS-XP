from decimal import Decimal

from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from transactions.models import Transaction
from transactions.serializers import TransactionSerializer
from transactions.utils import is_investment_category
from gamification.utils import build_gamification_stats


class DashboardView(APIView):
    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        income = Decimal('0')
        expenses = Decimal('0')
        investment_amount = Decimal('0')
        expenses_by_category = {}
        monthly_evolution = {}

        for transaction in transactions:
            is_investment = transaction.transaction_type == Transaction.TransactionType.INVESTMENT or is_investment_category(transaction.category)
            month = transaction.date.strftime('%Y-%m')
            monthly_evolution.setdefault(month, {'income': Decimal('0'), 'expenses': Decimal('0')})

            if transaction.transaction_type == Transaction.TransactionType.INCOME:
                income += transaction.amount
                monthly_evolution[month]['income'] += transaction.amount
            elif is_investment:
                investment_amount += transaction.amount
            elif not is_investment:
                expenses += transaction.amount
                monthly_evolution[month]['expenses'] += transaction.amount
                expenses_by_category[transaction.category] = expenses_by_category.get(transaction.category, Decimal('0')) + transaction.amount

        recent_transactions = transactions[:5]
        transactions_count = transactions.count()
        goals_count = request.user.goals.count()
        completed_goals = request.user.goals.filter(status='completed').count()
        investments_count = transactions.filter(
            Q(transaction_type=Transaction.TransactionType.INVESTMENT)
            | Q(category__iexact='Investimentos')
            | Q(category__iexact='Investimento')
        ).count()
        gamification = build_gamification_stats(
            transactions_count,
            goals_count,
            completed_goals,
            investments_count,
            income,
            investment_amount,
        )

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
                'gamification': gamification,
            }
        )
