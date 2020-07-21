from django.core.management import BaseCommand
from typing import List
from django.db.models import Count

from users.models import JustfixUser

# Maximum # of users who sent a NoRent letter.
MAX_SENT = 100

# Maximum # of users who didn't send a NoRent letter, but
# entered enough information to.
MAX_NOT_SENT = 50


def print_users(title: str, users: List[JustfixUser]):
    print(f"{title} ({len(users)}):\n")
    for user in users:
        print("  ", user.full_name, user.onboarding_info.state, user.email)
    print()


class Command(BaseCommand):
    def handle(self, *args, **options):
        users = JustfixUser.objects.filter(
            locale="es",
        ).annotate(
            num_letters=Count("norent_letters"),
        ).prefetch_related("onboarding_info", "landlord_details")

        sent: List[JustfixUser] = []
        not_sent: List[JustfixUser] = []

        for user in users:
            if user.num_letters == 0:
                if len(not_sent) < MAX_NOT_SENT:
                    was_able_to_send = (
                        hasattr(user, 'landlord_details') and
                        (user.landlord_details.email or
                         user.landlord_details.primary_line)
                    )
                    if was_able_to_send:
                        not_sent.append(user)
            else:
                if len(sent) < MAX_SENT:
                    sent.append(user)

        print_users(f"Spanish speakers who sent NoRent letters", sent)

        print_users(
            f"Spanish speakers who did NOT send NoRent letters, "
            f"but entered enough information to",
            not_sent
        )
