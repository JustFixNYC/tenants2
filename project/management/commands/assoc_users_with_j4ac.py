from typing import List
from pathlib import Path
from django.core.management import BaseCommand

from users.models import JustfixUser
from partnerships.models import PartnerOrg


PARTNER_SLUG = "j4ac"

FILENAME = Path("j4ac-phone-numbers.csv")


def get_phone_numbers() -> List[str]:
    result: List[str] = []
    for line in FILENAME.read_text().splitlines():
        # The CSV only contains one non-empty column, which is the phone
        # number with parentheses/spaces/hyphens, so just remove all those
        # characters to get the phone number.
        phone_number = line\
            .replace("(", "")\
            .replace(")", "")\
            .replace("-", "")\
            .replace(" ", "")\
            .replace(",", "")
        if phone_number:
            assert len(phone_number) == 10, f"{phone_number} should be 10 chars long"
            for digit in phone_number:
                assert digit in "0123456789", f"{phone_number} should consist of digits only"
            result.append(phone_number)
    return result


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--dry-run', help="don't actually change users",
                            action='store_true')

    def handle(self, *args, **options):
        dry_run: bool = options['dry_run']
        partner = PartnerOrg.objects.get(slug=PARTNER_SLUG)
        for phone_number in get_phone_numbers():
            print(f"Finding user with phone number {phone_number}.")
            user = JustfixUser.objects.get(phone_number=phone_number)
            if not dry_run:
                print(f"Associating user with {partner}.")
                user.partner_orgs.clear()
                user.partner_orgs.add(partner)
