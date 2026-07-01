from decimal import Decimal


LEVEL_BASE_XP = 200
LEVEL_XP_GROWTH = 75
INVESTMENT_RATE_XP_MULTIPLIER = 10
LEVEL_CLASSES = [
    (1, 'Iniciante Financeiro'),
    (5, 'Aprendiz Financeiro'),
    (10, 'Organizador'),
    (15, 'Planejador'),
    (20, 'Controlador'),
    (25, 'Poupador'),
    (30, 'Investidor'),
    (35, 'Estrategista'),
    (40, 'Especialista Financeiro'),
    (45, 'Mentor Financeiro'),
    (50, 'Magnata Financeiro'),
]

CHALLENGE_TRACKS = [
    {
        'id': 'transactions',
        'title': 'Registrar {target} transacoes',
        'count_key': 'transactions_count',
        'thresholds': [1, 5, 10, 20, 40, 80],
        'xp_step': 12,
    },
    {
        'id': 'goals',
        'title': 'Criar {target} metas',
        'count_key': 'goals_count',
        'thresholds': [1, 2, 5, 10, 20, 40],
        'xp_step': 30,
    },
    {
        'id': 'completed_goals',
        'title': 'Concluir {target} metas',
        'count_key': 'completed_goals_count',
        'thresholds': [1, 3, 5, 10, 20, 40],
        'xp_step': 160,
    },
    {
        'id': 'investments',
        'title': 'Cadastrar {target} investimentos',
        'count_key': 'investments_count',
        'thresholds': [1, 3, 5, 10, 20, 40],
        'xp_step': 140,
    },
]

def get_level_class(level):
    level_class = LEVEL_CLASSES[0][1]

    for required_level, class_name in LEVEL_CLASSES:
        if level < required_level:
            break

        level_class = class_name

    return level_class


def get_level_required_xp(level):
    return LEVEL_BASE_XP + max(0, level - 1) * LEVEL_XP_GROWTH


def get_total_xp_for_level(level):
    if level <= 1:
        return 0

    completed_levels = level - 1
    growth_xp = (completed_levels - 1) * completed_levels * LEVEL_XP_GROWTH // 2
    return completed_levels * LEVEL_BASE_XP + growth_xp


def get_level_from_xp(xp):
    level = 1

    while xp >= get_total_xp_for_level(level + 1):
        level += 1

    return level


def get_challenge_reward(target, xp_step):
    growth_multiplier = 1 + min(target, 100) / 100
    return int(target * xp_step * growth_multiplier)


def calculate_investment_rate(income_amount=0, investment_amount=0):
    income = Decimal(str(income_amount or 0))
    invested = Decimal(str(investment_amount or 0))

    if income <= 0 or invested <= 0:
        return Decimal('0')

    return min(Decimal('100'), invested / income * 100)


def build_gamification_stats(
    transactions_count,
    goals_count,
    completed_goals,
    investments_count,
    income_amount=0,
    investment_amount=0,
):
    investment_rate = calculate_investment_rate(income_amount, investment_amount)
    investment_bonus_xp = int(investment_rate * INVESTMENT_RATE_XP_MULTIPLIER)
    xp = (
        transactions_count * 10
        + goals_count * 20
        + completed_goals * 220
        + investments_count * 140
        + investment_bonus_xp
    )
    level = get_level_from_xp(xp)
    current_level_xp = get_total_xp_for_level(level)
    next_level_xp = get_total_xp_for_level(level + 1)
    level_span = next_level_xp - current_level_xp
    progress = int(((xp - current_level_xp) / level_span) * 100) if level_span else 0

    return {
        'xp': xp,
        'level': level,
        'level_class': get_level_class(level),
        'progress': progress,
        'current_level_xp': current_level_xp,
        'next_level_xp': next_level_xp,
        'level_required_xp': get_level_required_xp(level),
        'investment_rate': int(investment_rate),
        'investment_bonus_xp': investment_bonus_xp,
    }


def get_next_target(count, thresholds):
    for target in thresholds:
        if count < target:
            return target

    target = thresholds[-1] * 2

    while count >= target:
        target *= 2

    return target


def build_next_challenges(transactions_count, goals_count, completed_goals_count, investments_count):
    counts = {
        'transactions_count': transactions_count,
        'goals_count': goals_count,
        'completed_goals_count': completed_goals_count,
        'investments_count': investments_count,
    }
    challenges = []

    for track in CHALLENGE_TRACKS:
        current = counts[track['count_key']]
        target = get_next_target(current, track['thresholds'])
        progress = min(100, int((current / target) * 100)) if target else 0
        challenges.append(
            {
                'id': f"{track['id']}_{target}",
                'title': track['title'].format(target=target),
                'xp': get_challenge_reward(target, track['xp_step']),
                'progress': progress,
                'current': current,
                'target': target,
            }
        )

    return challenges
