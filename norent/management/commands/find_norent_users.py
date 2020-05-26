from typing import List
from datetime import date
from django.core.management import BaseCommand

from users.models import JustfixUser
from norent.models import RentPeriod
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

        # The payment date we want to tell people to send a letter for.
        # We'll be sure *not* to include users who have already sent
        # a letter for this date.
        PAYMENT_DATE = date(2020, 6, 1)

        rp = RentPeriod.objects.get(payment_date=PAYMENT_DATE)
        users = JustfixUser.objects.filter(
            onboarding_info__state__in=states
        ).exclude(
            norent_letters__rent_period__pk=rp.pk
        ).prefetch_related('onboarding_info')
        users = list(users)
        count = len(users)
        for user in users:
            onb = user.onboarding_info
            print(f"{user.first_name} ({user.username}) from {onb.city}, {onb.state}")
        print(f"{count} total users.")
