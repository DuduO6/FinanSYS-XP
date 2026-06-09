from django.conf import settings
from django.db import models


class Goal(models.Model):
    class GoalStatus(models.TextChoices):
        ACTIVE = 'active', 'Ativa'
        COMPLETED = 'completed', 'Concluida'
        PAUSED = 'paused', 'Pausada'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=120)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deadline = models.DateField()
    status = models.CharField(max_length=12, choices=GoalStatus.choices, default=GoalStatus.ACTIVE)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['deadline', '-created_at']

    @property
    def progress(self):
        if self.target_amount <= 0:
            return 0

        return min(100, int((self.current_amount / self.target_amount) * 100))

    def __str__(self):
        return self.title
