from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Investment


User = get_user_model()


class InvestmentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_create_investment(self):
        response = self.client.post(
            reverse('investment-list'),
            {'name': 'Tesouro Selic', 'investment_type': 'Renda fixa', 'amount': '1000.00', 'expected_return_rate': '10.50', 'start_date': '2026-06-09'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Investment.objects.first().user, self.user)

    def test_requires_authentication(self):
        self.client.credentials()
        response = self.client.get(reverse('investment-list'))

        self.assertEqual(response.status_code, 401)
