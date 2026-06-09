from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


User = get_user_model()


class ProfileApiTests(APITestCase):
    def test_profile_get_and_patch(self):
        user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        response = self.client.patch(reverse('profile-detail'), {'name': 'Dudu'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['name'], 'Dudu')
