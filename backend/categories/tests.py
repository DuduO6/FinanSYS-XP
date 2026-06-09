from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Category


User = get_user_model()


class CategoryApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        self.other_user = User.objects.create_user(username='outro@ufv.br', email='outro@ufv.br', password='123456')
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_create_category(self):
        response = self.client.post(reverse('category-list'), {'name': 'Saude', 'color': '#3267b7', 'icon': 'heart'}, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Category.objects.first().user, self.user)

    def test_list_includes_default_categories_for_user(self):
        response = self.client.get(reverse('category-list'))

        names = {category['name'] for category in response.data}

        self.assertEqual(response.status_code, 200)
        self.assertIn('Alimentação', names)
        self.assertIn('Moradia', names)
        self.assertTrue(Category.objects.filter(user=self.user, name='Saúde').exists())

    def test_list_only_user_custom_categories(self):
        Category.objects.create(user=self.user, name='Pets')
        Category.objects.create(user=self.other_user, name='Viagem')

        response = self.client.get(reverse('category-list'))
        names = {category['name'] for category in response.data}

        self.assertEqual(response.status_code, 200)
        self.assertIn('Pets', names)
        self.assertNotIn('Viagem', names)
