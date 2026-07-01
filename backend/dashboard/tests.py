from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from transactions.models import Transaction


User = get_user_model()


class DashboardApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='aluno@ufv.br',
            email='aluno@ufv.br',
            password='123456',
            first_name='Dudu',
        )
        self.other_user = User.objects.create_user(username='outro@ufv.br', email='outro@ufv.br', password='123456')
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_dashboard_returns_user_financial_summary(self):
        Transaction.objects.create(
            user=self.user,
            title='Salario',
            transaction_type='income',
            category='Trabalho',
            amount='3000.00',
            date='2026-06-09',
        )
        Transaction.objects.create(
            user=self.user,
            title='Mercado',
            transaction_type='expense',
            category='Alimentacao',
            amount='250.00',
            date='2026-06-09',
        )
        Transaction.objects.create(
            user=self.other_user,
            title='Aluguel',
            transaction_type='expense',
            category='Moradia',
            amount='900.00',
            date='2026-06-09',
        )

        response = self.client.get(reverse('dashboard-summary'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['summary']['income'], Decimal('3000.00'))
        self.assertEqual(response.data['summary']['expenses'], Decimal('250.00'))
        self.assertEqual(response.data['summary']['balance'], Decimal('2750.00'))
        self.assertEqual(response.data['expenses_by_category'], [{'category': 'Alimentacao', 'amount': Decimal('250.00')}])
        self.assertEqual(len(response.data['recent_transactions']), 2)
        self.assertEqual(response.data['gamification']['xp'], 20)

    def test_dashboard_requires_authentication(self):
        self.client.credentials()

        response = self.client.get(reverse('dashboard-summary'))

        self.assertEqual(response.status_code, 401)
