from datetime import timedelta
from django.utils.timezone import now
from django.core.management.base import BaseCommand

from norent.models import Letter
from project import common_data


class Command(BaseCommand):
    help = 'Show NoRent statistics.'

    def handle(self, *args, **options):
        state_law_letter = common_data.load_json("norent-state-law-for-letter-en.json")
        state_law_builder = common_data.load_json("norent-state-law-for-builder-en.json")
        letters = Letter.objects.filter(
            created_at__gt=now() - timedelta(days=15)
        )
        for letter in letters:
            state = letter.user.onboarding_info.state
            has_protections = not state_law_builder[state]['stateWithoutProtections']
            if has_protections:
                version = state_law_letter[state]['whichVersion']
            else:
                version = ''
            print(f"{state} - {version}")
