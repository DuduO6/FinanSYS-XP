from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from transactions.models import Transaction


User = get_user_model()


class ReportsApiTests(APITestCase):
    def test_returns_financial_reports(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        Transaction.objects.create(user=user, title='Salario', transaction_type='income', category='Trabalho', amount='3000.00', date='2026-06-09')
        Transaction.objects.create(user=user, title='Mercado', transaction_type='expense', category='Alimentacao', amount='300.00', date='2026-06-09')

        response = self.client.get(reverse('reports-summary'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['summary']['balance'], Decimal('2700.00'))
        self.assertEqual(response.data['expenses_by_category'][0]['category'], 'Alimentacao')
