from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase


User = get_user_model()


class AuthApiTests(APITestCase):
    def test_register_creates_user_and_returns_token(self):
        response = self.client.post(
            reverse('auth-register'),
            {
                'name': 'Aluno UFV',
                'email': 'aluno@ufv.br',
                'password': '123456',
                'confirmPassword': '123456',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'aluno@ufv.br')
        self.assertTrue(User.objects.filter(email='aluno@ufv.br').exists())

    def test_login_returns_token(self):
        User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')

        response = self.client.post(
            reverse('auth-login'),
            {'email': 'aluno@ufv.br', 'password': '123456'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)

    def test_me_requires_token(self):
        response = self.client.get(reverse('auth-me'))

        self.assertEqual(response.status_code, 401)
