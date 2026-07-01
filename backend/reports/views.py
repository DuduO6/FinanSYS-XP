from decimal import Decimal

from rest_framework.response import Response
from rest_framework.views import APIView

from transactions.models import Transaction
from transactions.utils import is_investment_category


class ReportsView(APIView):
    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        income = Decimal('0')
        expenses = Decimal('0')
        categories = {}
        monthly = {}

        for transaction in transactions:
            is_investment = transaction.transaction_type == Transaction.TransactionType.INVESTMENT or is_investment_category(transaction.category)
            month = transaction.date.strftime('%Y-%m')
            monthly.setdefault(month, {'income': Decimal('0'), 'expenses': Decimal('0')})

            if transaction.transaction_type == Transaction.TransactionType.INCOME:
                income += transaction.amount
                monthly[month]['income'] += transaction.amount
            elif not is_investment:
                expenses += transaction.amount
                monthly[month]['expenses'] += transaction.amount
                categories[transaction.category] = categories.get(transaction.category, Decimal('0')) + transaction.amount

        return Response(
            {
                'summary': {'income': income, 'expenses': expenses, 'balance': income - expenses},
                'expenses_by_category': [{'category': category, 'amount': amount} for category, amount in sorted(categories.items())],
                'monthly_evolution': [{'month': month, **values} for month, values in sorted(monthly.items())],
            }
        )
