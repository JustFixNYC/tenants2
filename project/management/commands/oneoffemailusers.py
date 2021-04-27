from django.core.management import BaseCommand
from pathlib import Path
from typing import List

from users.models import JustfixUser
from norent.la_zipcodes import LOS_ANGELES_ZIP_CODES


# Where we'll write our list of usernames out to.
OUTFILE = Path("oneoffemail.txt")


def print_users(title: str, users: List[JustfixUser]):
    print(f"{title} ({len(users)}):\n")
    for user in users:
        print("  ", user.full_name, user.onboarding_info.state, user.email)
    print()


class Command(BaseCommand):
    def handle(self, *args, **options):
        users = list(
            JustfixUser.objects.filter(
                onboarding_info__state="CA",
                onboarding_info__zipcode__in=LOS_ANGELES_ZIP_CODES,
            )
        )

        print_users(f"LA NoRent users", users)

        print(f"Writing {OUTFILE}.")
        OUTFILE.write_text("\n".join([user.username for user in users]))
