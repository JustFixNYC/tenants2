from django.core.management import BaseCommand
from pathlib import Path
from typing import List

from users.models import JustfixUser

# Where we'll write our list of usernames out to.
OUTFILE = Path("oneoffemail.txt")


def print_users(title: str, users: List[JustfixUser]):
    print(f"{title} ({len(users)}):\n")
    for user in users:
        print("  ", user.full_name, user.onboarding_info.state, user.email)
    print()


class Command(BaseCommand):
    def handle(self, *args, **options):
        users = list(JustfixUser.objects.filter(
            onboarding_info__state="CA",
        ))

        print_users(f"California NoRent users", users)

        print(f"Writing {OUTFILE}.")
        OUTFILE.write_text(
            '\n'.join([user.username for user in users])
        )
