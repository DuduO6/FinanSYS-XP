from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from goals.models import Goal
from investments.models import Investment
from transactions.models import Transaction
from .utils import get_challenge_reward, get_level_class, get_level_from_xp, get_total_xp_for_level


User = get_user_model()


class GamificationApiTests(APITestCase):
    def test_level_classes_follow_progressive_badges(self):
        self.assertEqual(get_level_class(1), 'Iniciante Financeiro')
        self.assertEqual(get_level_class(5), 'Aprendiz Financeiro')
        self.assertEqual(get_level_class(10), 'Organizador')
        self.assertEqual(get_level_class(50), 'Magnata Financeiro')
        self.assertEqual(get_level_class(99), 'Magnata Financeiro')

    def test_level_xp_requirement_grows_by_level(self):
        self.assertEqual(get_total_xp_for_level(1), 0)
        self.assertLess(get_total_xp_for_level(2) - get_total_xp_for_level(1), get_total_xp_for_level(3) - get_total_xp_for_level(2))
        self.assertEqual(get_level_from_xp(get_total_xp_for_level(5)), 5)

    def test_challenge_rewards_grow_with_larger_tasks(self):
        self.assertLess(get_challenge_reward(5, 12), get_challenge_reward(10, 12))
        self.assertLess(get_challenge_reward(10, 12), get_challenge_reward(20, 12))

    def test_returns_xp_and_achievements(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        Transaction.objects.create(user=user, title='Salario', transaction_type='income', category='Trabalho', amount='1000.00', date='2026-06-09')
        Goal.objects.create(user=user, title='Reserva', target_amount='1000.00', current_amount='1000.00', deadline='2026-12-31', status='completed')

        response = self.client.get(reverse('gamification-summary'))

        self.assertEqual(response.status_code, 200)
        self.assertGreater(response.data['xp'], 0)
        self.assertEqual(response.data['level_class'], 'Iniciante Financeiro')
        self.assertTrue(any(item['unlocked'] for item in response.data['achievements']))

    def test_returns_next_challenges_after_completed_milestones(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        for index in range(5):
            Transaction.objects.create(
                user=user,
                title=f'Transacao {index}',
                transaction_type='income',
                category='Trabalho',
                amount='100.00',
                date='2026-06-09',
            )

        response = self.client.get(reverse('gamification-summary'))
        transaction_challenge = next(
            challenge for challenge in response.data['challenges'] if challenge['id'] == 'transactions_10'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(transaction_challenge['target'], 10)
        self.assertEqual(transaction_challenge['current'], 5)
        self.assertEqual(transaction_challenge['progress'], 50)
        self.assertEqual(transaction_challenge['xp'], get_challenge_reward(10, 12))

    def test_returns_ranking_ordered_by_level_and_xp(self):
        current_user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        other_user = User.objects.create_user(username='lider@ufv.br', email='lider@ufv.br', password='123456', first_name='Lider')
        token = Token.objects.create(user=current_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        Transaction.objects.create(user=current_user, title='Bolsa', transaction_type='income', category='Trabalho', amount='700.00', date='2026-06-09')
        Transaction.objects.create(user=other_user, title='Salario', transaction_type='income', category='Trabalho', amount='2000.00', date='2026-06-09')
        Goal.objects.create(user=other_user, title='Reserva', target_amount='1000.00', current_amount='1000.00', deadline='2026-12-31', status='completed')
        Investment.objects.create(user=other_user, name='Tesouro', investment_type='Renda fixa', amount='500.00', start_date='2026-06-10')

        response = self.client.get(reverse('gamification-ranking'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['name'], 'Lider')
        self.assertGreater(response.data[0]['level'], response.data[1]['level'])
        self.assertEqual(response.data[0]['level_class'], 'Iniciante Financeiro')
        self.assertTrue(response.data[1]['is_current_user'])
        self.assertNotIn('email', response.data[0])
        self.assertNotIn('transactions_count', response.data[0])

    def test_investment_category_counts_for_points_and_tasks(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        Transaction.objects.create(user=user, title='Salario', transaction_type='income', category='Trabalho', amount='1000.00', date='2026-06-09')
        Transaction.objects.create(user=user, title='Aplicacao', transaction_type='expense', category='Investimentos', amount='200.00', date='2026-06-10')

        response = self.client.get(reverse('gamification-summary'))
        investment_challenge = next(
            challenge for challenge in response.data['challenges'] if challenge['id'] == 'investments_3'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['xp'], 360)
        self.assertEqual(response.data['investment_rate'], 20)
        self.assertEqual(response.data['investment_bonus_xp'], 200)
        self.assertTrue(next(item for item in response.data['achievements'] if item['id'] == 'investor')['unlocked'])
        self.assertFalse(any('%' in item['description'] for item in response.data['achievements']))
        self.assertFalse(any('%' in item['title'] for item in response.data['challenges']))
        self.assertEqual(investment_challenge['current'], 1)

    def test_investment_rate_bonus_grows_with_income_percentage(self):
        conservative_user = User.objects.create_user(username='baixo@ufv.br', email='baixo@ufv.br', password='123456')
        aggressive_user = User.objects.create_user(username='alto@ufv.br', email='alto@ufv.br', password='123456')
        Token.objects.create(user=conservative_user)
        token = Token.objects.create(user=aggressive_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        Transaction.objects.create(user=conservative_user, title='Salario', transaction_type='income', category='Trabalho', amount='1000.00', date='2026-06-09')
        Transaction.objects.create(user=conservative_user, title='Aplicacao', transaction_type='investment', category='Outros', amount='100.00', date='2026-06-10')
        Transaction.objects.create(user=aggressive_user, title='Salario', transaction_type='income', category='Trabalho', amount='1000.00', date='2026-06-09')
        Transaction.objects.create(user=aggressive_user, title='Aplicacao', transaction_type='investment', category='Outros', amount='400.00', date='2026-06-10')

        response = self.client.get(reverse('gamification-summary'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['investment_rate'], 40)
        self.assertEqual(response.data['investment_bonus_xp'], 400)
        self.assertFalse(any('%' in challenge['title'] for challenge in response.data['challenges']))
