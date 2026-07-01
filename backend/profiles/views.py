from django.db.models import Q, Sum
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from gamification.utils import build_gamification_stats
from transactions.models import Transaction


class ProfileView(APIView):
    def get(self, request):
        user = request.user
        transactions = user.transactions.all()
        investment_transactions = transactions.filter(
            Q(transaction_type=Transaction.TransactionType.INVESTMENT)
            | Q(category__iexact='Investimentos')
            | Q(category__iexact='Investimento')
        )
        income_amount = transactions.filter(transaction_type=Transaction.TransactionType.INCOME).aggregate(total=Sum('amount'))['total'] or 0
        investment_amount = investment_transactions.aggregate(total=Sum('amount'))['total'] or 0
        gamification = build_gamification_stats(
            transactions.count(),
            user.goals.count(),
            user.goals.filter(status='completed').count(),
            investment_transactions.count(),
            income_amount,
            investment_amount,
        )

        return Response(
            {
                'user': {'id': user.id, 'name': user.first_name, 'email': user.email, 'username': user.username},
                'stats': {
                    'transactions': user.transactions.count(),
                    'goals': user.goals.count(),
                    'completed_goals': user.goals.filter(status='completed').count(),
                    'investments': user.investments.count() if hasattr(user, 'investments') else 0,
                },
                'gamification': gamification,
            }
        )

    def patch(self, request):
        user = request.user
        user.first_name = request.data.get('name', user.first_name)
        user.save(update_fields=['first_name'])
        return self.get(request)

    def put(self, request):
        user = request.user
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')

        if not user.check_password(current_password):
            return Response({'detail': 'Senha atual inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'detail': 'A nova senha deve ter pelo menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        Token.objects.filter(user=user).delete()

        return Response({'detail': 'Senha atualizada. Faça login novamente.'})

    def delete(self, request):
        user = request.user
        password = request.data.get('password', '')

        if not user.check_password(password):
            return Response({'detail': 'Senha inválida para apagar a conta.'}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
