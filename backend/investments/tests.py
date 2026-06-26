from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from transactions.models import Transaction
from .models import Investment


User = get_user_model()


class InvestmentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_create_investment(self):
        Transaction.objects.create(
            user=self.user,
            title='Salario',
            transaction_type='income',
            category='Trabalho',
            amount='1500.00',
            date='2026-06-08',
        )

        response = self.client.post(
            reverse('investment-list'),
            {'name': 'Tesouro Selic', 'investment_type': 'Renda fixa', 'amount': '1000.00', 'start_date': '2026-06-09'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Investment.objects.first().user, self.user)
        self.assertEqual(Transaction.objects.filter(transaction_type='investment').count(), 1)
        self.assertEqual(response.data['expected_return_rate'], '0.80')
        self.assertIn('actual_return_amount', response.data)

    def test_rejects_investment_without_available_balance(self):
        response = self.client.post(
            reverse('investment-list'),
            {'name': 'Tesouro Selic', 'investment_type': 'Renda fixa', 'amount': '1000.00', 'start_date': '2026-06-09'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Investment.objects.count(), 0)

    def test_requires_authentication(self):
        self.client.credentials()
        response = self.client.get(reverse('investment-list'))

        self.assertEqual(response.status_code, 401)
