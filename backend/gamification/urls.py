from django.urls import path

from .views import GamificationView, RankingView


urlpatterns = [
    path('', GamificationView.as_view(), name='gamification-summary'),
    path('ranking/', RankingView.as_view(), name='gamification-ranking'),
]
