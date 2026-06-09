from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Transaction


User = get_user_model()


class TransactionApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        self.other_user = User.objects.create_user(username='outro@ufv.br', email='outro@ufv.br', password='123456')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_create_transaction_for_authenticated_user(self):
        response = self.client.post(
            reverse('transaction-list'),
            {
                'title': 'Salario',
                'transaction_type': 'income',
                'category': 'Trabalho',
                'amount': '2500.00',
                'date': '2026-06-08',
                'description': 'Pagamento mensal',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Transaction.objects.count(), 1)
        self.assertEqual(Transaction.objects.first().user, self.user)

    def test_list_only_authenticated_user_transactions(self):
        Transaction.objects.create(
            user=self.user,
            title='Mercado',
            transaction_type='expense',
            category='Alimentacao',
            amount='120.00',
            date='2026-06-08',
        )
        Transaction.objects.create(
            user=self.other_user,
            title='Aluguel',
            transaction_type='expense',
            category='Moradia',
            amount='900.00',
            date='2026-06-08',
        )

        response = self.client.get(reverse('transaction-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Mercado')

    def test_requires_authentication(self):
        self.client.credentials()

        response = self.client.get(reverse('transaction-list'))

        self.assertEqual(response.status_code, 401)
