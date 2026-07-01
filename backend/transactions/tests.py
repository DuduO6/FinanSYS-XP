from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from goals.models import Goal
from investments.models import Investment
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

    def test_goal_transaction_updates_goal_progress(self):
        Transaction.objects.create(
            user=self.user,
            title='Salario',
            transaction_type='income',
            category='Trabalho',
            amount='1000.00',
            date='2026-06-08',
        )
        goal = Goal.objects.create(
            user=self.user,
            title='Reserva',
            target_amount='500.00',
            current_amount='250.00',
            deadline='2026-12-31',
        )

        response = self.client.post(
            reverse('transaction-list'),
            {
                'title': 'Aporte reserva',
                'transaction_type': 'goal',
                'category': 'Metas',
                'amount': '250.00',
                'date': '2026-06-09',
                'target_goal': goal.id,
            },
            format='json',
        )

        goal.refresh_from_db()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(goal.current_amount, goal.target_amount)
        self.assertEqual(goal.status, Goal.GoalStatus.COMPLETED)

    def test_investment_transaction_updates_investment_amount(self):
        Transaction.objects.create(
            user=self.user,
            title='Salario',
            transaction_type='income',
            category='Trabalho',
            amount='1000.00',
            date='2026-06-08',
        )
        investment = Investment.objects.create(
            user=self.user,
            name='Tesouro Selic',
            investment_type='Renda fixa',
            amount='100.00',
            expected_return_rate='10.00',
            start_date='2026-06-08',
        )

        response = self.client.post(
            reverse('transaction-list'),
            {
                'title': 'Aplicacao',
                'transaction_type': 'investment',
                'category': 'Outros',
                'amount': '300.00',
                'date': '2026-06-09',
                'target_investment': investment.id,
            },
            format='json',
        )

        investment.refresh_from_db()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(str(investment.amount), '400.00')

    def test_investment_category_transaction_is_saved_as_investment(self):
        Transaction.objects.create(
            user=self.user,
            title='Salario',
            transaction_type='income',
            category='Trabalho',
            amount='1000.00',
            date='2026-06-08',
        )

        response = self.client.post(
            reverse('transaction-list'),
            {
                'title': 'Aplicacao avulsa',
                'transaction_type': 'expense',
                'category': 'Investimentos',
                'amount': '300.00',
                'date': '2026-06-09',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['transaction_type'], Transaction.TransactionType.INVESTMENT)
        self.assertEqual(response.data['category'], 'Outros')
        self.assertIsNone(response.data['target_investment'])

    def test_rejects_outflow_greater_than_available_balance(self):
        Transaction.objects.create(
            user=self.user,
            title='Salario',
            transaction_type='income',
            category='Trabalho',
            amount='1000.00',
            date='2026-06-08',
        )
        Transaction.objects.create(
            user=self.user,
            title='Mercado',
            transaction_type='expense',
            category='Alimentacao',
            amount='250.00',
            date='2026-06-08',
        )
        investment = Investment.objects.create(
            user=self.user,
            name='Tesouro Selic',
            investment_type='Renda fixa',
            amount='0.01',
            expected_return_rate='10.00',
            start_date='2026-06-08',
        )

        response = self.client.post(
            reverse('transaction-list'),
            {
                'title': 'Aplicacao maior que saldo',
                'transaction_type': 'investment',
                'category': 'Outros',
                'amount': '800.00',
                'date': '2026-06-09',
                'target_investment': investment.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
