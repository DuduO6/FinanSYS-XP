from rest_framework import viewsets

from transactions.utils import is_investment_category
from .models import Category
from .serializers import CategorySerializer


DEFAULT_CATEGORIES = [
    {'name': 'Alimentação', 'color': '#157f65', 'icon': 'food'},
    {'name': 'Moradia', 'color': '#3267b7', 'icon': 'home'},
    {'name': 'Transporte', 'color': '#7c3aed', 'icon': 'car'},
    {'name': 'Saúde', 'color': '#dc2626', 'icon': 'heart'},
    {'name': 'Educação', 'color': '#ca8a04', 'icon': 'book'},
    {'name': 'Lazer', 'color': '#db2777', 'icon': 'fun'},
    {'name': 'Trabalho', 'color': '#475569', 'icon': 'work'},
    {'name': 'Freelance', 'color': '#0891b2', 'icon': 'job'},
    {'name': 'Outros', 'color': '#64748b', 'icon': 'tag'},
]


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer

    def ensure_default_categories(self):
        for category in DEFAULT_CATEGORIES:
            Category.objects.get_or_create(
                user=self.request.user,
                name=category['name'],
                defaults={
                    'color': category['color'],
                    'icon': category['icon'],
                },
            )

    def get_queryset(self):
        self.ensure_default_categories()
        category_ids = [
            category.id
            for category in Category.objects.filter(user=self.request.user)
            if not is_investment_category(category.name)
        ]
        return Category.objects.filter(id__in=category_ids)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
