from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from goals.models import Goal
from transactions.models import Transaction


User = get_user_model()


class GamificationApiTests(APITestCase):
    def test_returns_xp_and_achievements(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        Transaction.objects.create(user=user, title='Salario', transaction_type='income', category='Trabalho', amount='1000.00', date='2026-06-09')
        Goal.objects.create(user=user, title='Reserva', target_amount='1000.00', current_amount='1000.00', deadline='2026-12-31', status='completed')

        response = self.client.get(reverse('gamification-summary'))

        self.assertEqual(response.status_code, 200)
        self.assertGreater(response.data['xp'], 0)
        self.assertTrue(any(item['unlocked'] for item in response.data['achievements']))
