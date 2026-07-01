import random
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model

from gamification.utils import get_level_from_xp, get_total_xp_for_level
from goals.models import Goal
from transactions.models import Transaction


FOOTBALL_LEGENDS = [
    ('pele', 'Pele'),
    ('lionel.messi', 'Lionel Messi'),
    ('diego.maradona', 'Diego Maradona'),
    ('cristiano.ronaldo', 'Cristiano Ronaldo'),
    ('johan.cruyff', 'Johan Cruyff'),
    ('ronaldo.nazario', 'Ronaldo Nazario'),
    ('zinedine.zidane', 'Zinedine Zidane'),
    ('franz.beckenbauer', 'Franz Beckenbauer'),
    ('ronaldinho.gaucho', 'Ronaldinho Gaucho'),
    ('alfredo.di.stefano', 'Alfredo Di Stefano'),
]

USERNAME_DOMAIN = 'football-legends.local'
SEED_DATE = date(2026, 7, 1)
SEED_MARKER = 'football-legends-ranking-seed'


def ensure_football_legends_seeded():
    user_model = get_user_model()
    created = []
    skipped = []

    for slug, name in FOOTBALL_LEGENDS:
        username = f'{slug}@{USERNAME_DOMAIN}'
        user, was_created = user_model.objects.get_or_create(
            username=username,
            defaults={
                'email': username,
                'first_name': name,
            },
        )

        if was_created:
            user.set_unusable_password()
            user.save(update_fields=['password'])
        elif not user.first_name:
            user.first_name = name
            user.save(update_fields=['first_name'])

        if _has_seed_data(user):
            skipped.append(name)
            continue

        target_xp = _random_xp_for_slug(slug)
        completed_goals, investment_transactions, active_goals, expense_transactions = _split_xp(target_xp)
        _create_completed_goals(user, completed_goals)
        _create_active_goals(user, active_goals)
        _create_investment_transactions(user, investment_transactions)
        _create_expense_transactions(user, expense_transactions)
        created.append((name, get_level_from_xp(target_xp), target_xp))

    return {'created': created, 'skipped': skipped}


def _has_seed_data(user):
    return (
        user.goals.filter(description__icontains=SEED_MARKER).exists()
        or user.transactions.filter(description__icontains=SEED_MARKER).exists()
    )


def _random_xp_for_slug(slug):
    rng = random.Random(slug)
    level = rng.randint(25, 55)
    min_xp = get_total_xp_for_level(level)
    max_xp = get_total_xp_for_level(level + 1) - 10
    min_xp_units = (min_xp + 9) // 10
    max_xp_units = max_xp // 10
    return rng.randrange(min_xp_units, max_xp_units + 1) * 10


def _split_xp(target_xp):
    completed_goals = target_xp // 240
    remainder = target_xp % 240
    investment_transactions = remainder // 150
    remainder %= 150
    active_goals = remainder // 20
    remainder %= 20
    expense_transactions = remainder // 10

    return completed_goals, investment_transactions, active_goals, expense_transactions


def _create_completed_goals(user, count):
    Goal.objects.bulk_create(
        [
            Goal(
                user=user,
                title=f'Titulo mundial #{index + 1}',
                target_amount=Decimal('1000.00'),
                current_amount=Decimal('1000.00'),
                deadline=SEED_DATE,
                status=Goal.GoalStatus.COMPLETED,
                description=SEED_MARKER,
            )
            for index in range(count)
        ],
        batch_size=500,
    )


def _create_active_goals(user, count):
    Goal.objects.bulk_create(
        [
            Goal(
                user=user,
                title=f'Objetivo lendario #{index + 1}',
                target_amount=Decimal('1000.00'),
                current_amount=Decimal('250.00'),
                deadline=SEED_DATE,
                status=Goal.GoalStatus.ACTIVE,
                description=SEED_MARKER,
            )
            for index in range(count)
        ],
        batch_size=500,
    )


def _create_investment_transactions(user, count):
    Transaction.objects.bulk_create(
        [
            Transaction(
                user=user,
                title=f'Investimento lendario #{index + 1}',
                transaction_type=Transaction.TransactionType.INVESTMENT,
                category='Investimentos',
                amount=Decimal('100.00'),
                date=SEED_DATE,
                description=SEED_MARKER,
            )
            for index in range(count)
        ],
        batch_size=500,
    )


def _create_expense_transactions(user, count):
    Transaction.objects.bulk_create(
        [
            Transaction(
                user=user,
                title=f'Ajuste lendario #{index + 1}',
                transaction_type=Transaction.TransactionType.EXPENSE,
                category='Ajuste XP',
                amount=Decimal('100.00'),
                date=SEED_DATE,
                description=SEED_MARKER,
            )
            for index in range(count)
        ],
        batch_size=500,
    )
