from typing import List
from django.core.management import BaseCommand

from users.models import JustfixUser
from project import common_data


def get_states_with_protections() -> List[str]:
    lfb = common_data.load_json('norent-state-law-for-builder-en.json')

    return [
        state for state, info in lfb.items()
        if info['stateWithoutProtections'] is False
    ]


class Command(BaseCommand):
    def handle(self, *args, **options):
        states = get_states_with_protections()
        users = list(JustfixUser.objects.filter(
            onboarding_info__state__in=states
        ).prefetch_related('onboarding_info'))
        count = len(users)
        for user in users:
            onb = user.onboarding_info
            print(f"{user.first_name} ({user.username}) from {onb.city}, {onb.state}")
        print(f"{count} total users.")
