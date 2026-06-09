from django.urls import path

from .views import GamificationView


urlpatterns = [
    path('', GamificationView.as_view(), name='gamification-summary'),
]
