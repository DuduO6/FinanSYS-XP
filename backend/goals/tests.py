from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Goal


User = get_user_model()


class GoalApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='aluno@ufv.br', email='aluno@ufv.br', password='123456')
        self.other_user = User.objects.create_user(username='outro@ufv.br', email='outro@ufv.br', password='123456')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_create_goal_for_authenticated_user(self):
        response = self.client.post(
            reverse('goal-list'),
            {
                'title': 'Reserva de emergencia',
                'target_amount': '6000.00',
                'current_amount': '1200.00',
                'deadline': '2026-12-31',
                'description': 'Guardar seis meses de custos.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Goal.objects.count(), 1)
        self.assertEqual(Goal.objects.first().user, self.user)
        self.assertEqual(response.data['progress'], 20)

    def test_list_only_authenticated_user_goals(self):
        Goal.objects.create(
            user=self.user,
            title='Notebook',
            target_amount='4000.00',
            current_amount='1000.00',
            deadline='2026-09-30',
        )
        Goal.objects.create(
            user=self.other_user,
            title='Viagem',
            target_amount='3000.00',
            current_amount='500.00',
            deadline='2026-10-30',
        )

        response = self.client.get(reverse('goal-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Notebook')

    def test_update_goal_current_amount(self):
        goal = Goal.objects.create(
            user=self.user,
            title='Reserva',
            target_amount='5000.00',
            current_amount='1000.00',
            deadline='2026-12-31',
        )

        response = self.client.patch(
            reverse('goal-detail', args=[goal.id]),
            {'current_amount': '2500.00'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['progress'], 50)

    def test_rejects_current_amount_greater_than_target(self):
        response = self.client.post(
            reverse('goal-list'),
            {
                'title': 'Meta invalida',
                'target_amount': '1000.00',
                'current_amount': '1200.00',
                'deadline': '2026-12-31',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)

    def test_requires_authentication(self):
        self.client.credentials()

        response = self.client.get(reverse('goal-list'))

        self.assertEqual(response.status_code, 401)
