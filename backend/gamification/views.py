from rest_framework.response import Response
from rest_framework.views import APIView


class GamificationView(APIView):
    def get(self, request):
        transactions_count = request.user.transactions.count()
        goals_count = request.user.goals.count()
        completed_goals = request.user.goals.filter(status='completed').count()
        investments_count = request.user.investments.count() if hasattr(request.user, 'investments') else 0
        xp = transactions_count * 20 + goals_count * 40 + completed_goals * 160 + investments_count * 60
        level = max(1, xp // 250 + 1)
        progress = int((xp % 250) / 250 * 100)
        achievements = [
            {'id': 'first_transaction', 'title': 'Primeiro registro', 'description': 'Cadastre sua primeira transacao.', 'unlocked': transactions_count >= 1},
            {'id': 'planner', 'title': 'Planejador', 'description': 'Crie sua primeira meta financeira.', 'unlocked': goals_count >= 1},
            {'id': 'goal_completed', 'title': 'Meta concluida', 'description': 'Finalize uma meta financeira.', 'unlocked': completed_goals >= 1},
            {'id': 'investor', 'title': 'Investidor inicial', 'description': 'Cadastre um investimento.', 'unlocked': investments_count >= 1},
        ]
        challenges = [
            {'id': 'weekly_records', 'title': 'Registrar 5 transacoes', 'xp': 120, 'progress': min(100, transactions_count * 20)},
            {'id': 'two_goals', 'title': 'Criar 2 metas', 'xp': 160, 'progress': min(100, goals_count * 50)},
            {'id': 'start_investing', 'title': 'Cadastrar 1 investimento', 'xp': 180, 'progress': min(100, investments_count * 100)},
        ]

        return Response({'xp': xp, 'level': level, 'progress': progress, 'achievements': achievements, 'challenges': challenges})
