from django.core.management.base import BaseCommand, CommandError

from loc.landlord_lookup import lookup_landlord


class Command(BaseCommand):
    help = "Obtain landlord information for the given address"

    def add_arguments(self, parser):
        parser.add_argument("address")

    def handle(self, *args, **options) -> None:
        info = lookup_landlord(options["address"])
        if info is None:
            raise CommandError("Landlord lookup failed!")
        self.stdout.write(f"Landlord name: {info.name}")
        self.stdout.write(f"Landlord primary address line: {info.primary_line}")
        self.stdout.write(
            f"Landlord city / state / zip: " f"{info.city} / {info.state} / {info.zip_code}"
        )
        self.stdout.write(f"Landlord full mailing address:\n")
        for line in info.address.splitlines():
            self.stdout.write(f"  {line}")
