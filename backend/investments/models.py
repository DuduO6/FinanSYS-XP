from django.conf import settings
from django.db import models


class Investment(models.Model):
    class InvestmentStatus(models.TextChoices):
        ACTIVE = 'active', 'Ativo'
        CLOSED = 'closed', 'Encerrado'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='investments')
    name = models.CharField(max_length=120)
    investment_type = models.CharField(max_length=80)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expected_return_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    start_date = models.DateField()
    status = models.CharField(max_length=10, choices=InvestmentStatus.choices, default=InvestmentStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date', '-created_at']

    def __str__(self):
        return self.name
