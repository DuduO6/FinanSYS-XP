from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from transactions.models import Transaction


User = get_user_model()


class ProfileApiTests(APITestCase):
    def test_profile_get_and_patch(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        response = self.client.patch(reverse('profile-detail'), {'name': 'Dudu'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['name'], 'Dudu')

    def test_profile_returns_level_and_xp(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        Transaction.objects.create(
            user=user,
            title='Salario',
            transaction_type='income',
            category='Trabalho',
            amount='1000.00',
            date='2026-06-09',
        )

        response = self.client.get(reverse('profile-detail'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['gamification']['xp'], 10)
        self.assertEqual(response.data['gamification']['level'], 1)
        self.assertEqual(response.data['gamification']['level_class'], 'Iniciante Financeiro')

    def test_profile_updates_password_and_invalidates_token(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        response = self.client.put(
            reverse('profile-detail'),
            {'current_password': '123456', 'new_password': 'nova123'},
            format='json',
        )
        user.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.check_password('nova123'))
        self.assertFalse(Token.objects.filter(key=token.key).exists())

    def test_profile_delete_removes_account(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        response = self.client.delete(reverse('profile-detail'), {'password': '123456'}, format='json')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(id=user.id).exists())
