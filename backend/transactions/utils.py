def normalize_text(value):
    normalized = str(value or '').strip().lower()
    replacements = {
        'á': 'a',
        'à': 'a',
        'ã': 'a',
        'â': 'a',
        'é': 'e',
        'ê': 'e',
        'í': 'i',
        'ó': 'o',
        'ô': 'o',
        'õ': 'o',
        'ú': 'u',
        'ç': 'c',
    }

    for source, target in replacements.items():
        normalized = normalized.replace(source, target)

    return normalized


def is_investment_category(category):
    return normalize_text(category) in {'investimento', 'investimentos'}
