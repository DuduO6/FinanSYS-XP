from rest_framework.response import Response
from rest_framework.views import APIView


class ProfileView(APIView):
    def get(self, request):
        user = request.user
        return Response(
            {
                'user': {'id': user.id, 'name': user.first_name, 'email': user.email, 'username': user.username},
                'stats': {
                    'transactions': user.transactions.count(),
                    'goals': user.goals.count(),
                    'completed_goals': user.goals.filter(status='completed').count(),
                    'investments': user.investments.count() if hasattr(user, 'investments') else 0,
                },
            }
        )

    def patch(self, request):
        user = request.user
        user.first_name = request.data.get('name', user.first_name)
        user.save(update_fields=['first_name'])
        return self.get(request)
