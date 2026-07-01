from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from .football_legends import ensure_football_legends_seeded
from transactions.models import Transaction
from .utils import build_gamification_stats, build_next_challenges


User = get_user_model()
INVESTMENT_TRANSACTION_FILTER = (
    Q(transactions__transaction_type=Transaction.TransactionType.INVESTMENT)
    | Q(transactions__category__iexact='Investimentos')
    | Q(transactions__category__iexact='Investimento')
)


class GamificationView(APIView):
    def get(self, request):
        user_transactions = request.user.transactions.all()
        transactions_count = request.user.transactions.count()
        goals_count = request.user.goals.count()
        completed_goals = request.user.goals.filter(status='completed').count()
        investment_transactions = user_transactions.filter(
            Q(transaction_type=Transaction.TransactionType.INVESTMENT)
            | Q(category__iexact='Investimentos')
            | Q(category__iexact='Investimento')
        )
        investments_count = investment_transactions.count()
        income_amount = user_transactions.filter(transaction_type=Transaction.TransactionType.INCOME).aggregate(total=Sum('amount'))['total'] or 0
        investment_amount = investment_transactions.aggregate(total=Sum('amount'))['total'] or 0
        stats = build_gamification_stats(
            transactions_count,
            goals_count,
            completed_goals,
            investments_count,
            income_amount,
            investment_amount,
        )
        achievements = [
            {'id': 'first_transaction', 'title': 'Primeiro registro', 'description': 'Cadastre sua primeira transacao.', 'unlocked': transactions_count >= 1},
            {'id': 'planner', 'title': 'Planejador', 'description': 'Crie sua primeira meta financeira.', 'unlocked': goals_count >= 1},
            {'id': 'goal_completed', 'title': 'Meta concluida', 'description': 'Finalize uma meta financeira.', 'unlocked': completed_goals >= 1},
            {'id': 'investor', 'title': 'Investidor inicial', 'description': 'Cadastre um investimento.', 'unlocked': investments_count >= 1},
        ]
        challenges = build_next_challenges(transactions_count, goals_count, completed_goals, investments_count)

        return Response({**stats, 'achievements': achievements, 'challenges': challenges})


class RankingView(APIView):
    def get(self, request):
        ensure_football_legends_seeded()
        users = User.objects.annotate(
            transactions_total=Count('transactions', distinct=True),
            goals_total=Count('goals', distinct=True),
            completed_goals_total=Count('goals', filter=Q(goals__status='completed'), distinct=True),
            investments_total=Count('transactions', filter=INVESTMENT_TRANSACTION_FILTER, distinct=True),
        )
        ranking = []

        for user in users:
            user_transactions = user.transactions.all()
            investment_transactions = user_transactions.filter(
                Q(transaction_type=Transaction.TransactionType.INVESTMENT)
                | Q(category__iexact='Investimentos')
                | Q(category__iexact='Investimento')
            )
            income_total = user_transactions.filter(transaction_type=Transaction.TransactionType.INCOME).aggregate(total=Sum('amount'))['total'] or 0
            investment_total = investment_transactions.aggregate(total=Sum('amount'))['total'] or 0
            stats = build_gamification_stats(
                user.transactions_total,
                user.goals_total,
                user.completed_goals_total,
                user.investments_total,
                income_total,
                investment_total,
            )
            display_name = user.first_name or user.username or user.email or f'Usuario {user.id}'
            ranking.append(
                {
                    'id': user.id,
                    'name': display_name,
                    'is_current_user': user.id == request.user.id,
                    **stats,
                }
            )

        ranking.sort(key=lambda item: (-item['level'], -item['xp'], item['name'].lower()))

        return Response(
            [
                {
                    **item,
                    'position': index + 1,
                }
                for index, item in enumerate(ranking)
            ]
        )
