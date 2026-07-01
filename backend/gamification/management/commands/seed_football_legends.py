from django.core.management.base import BaseCommand

from gamification.football_legends import ensure_football_legends_seeded


class Command(BaseCommand):
    help = 'Cria 10 lendas do futebol como usuarios seed para aparecerem no ranking.'

    def handle(self, *args, **options):
        result = ensure_football_legends_seeded()

        for name, level, xp in result['created']:
            self.stdout.write(self.style.SUCCESS(f'{name} criado com nivel {level} e {xp} XP.'))

        for name in result['skipped']:
            self.stdout.write(self.style.WARNING(f'{name} ja possui dados seed. Pulando.'))

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed finalizado: {len(result['created'])} criados, {len(result['skipped'])} ja existentes."
            )
        )
