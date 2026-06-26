from django.conf import settings
from django.db import models


class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        INCOME = 'income', 'Receita'
        EXPENSE = 'expense', 'Despesa'
        GOAL = 'goal', 'Aporte em meta'
        INVESTMENT = 'investment', 'Investimento'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    title = models.CharField(max_length=120)
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    category = models.CharField(max_length=80)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)
    target_goal = models.ForeignKey('goals.Goal', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    target_investment = models.ForeignKey('investments.Investment', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.amount}'
