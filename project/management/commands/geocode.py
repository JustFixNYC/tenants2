from django.core.management.base import BaseCommand, CommandError

from project import geocoding


class Command(BaseCommand):
    help = "Obtain geocoding information for the given address"

    def add_arguments(self, parser):
        parser.add_argument("address")

    def handle(self, *args, **options):
        features = geocoding.search(options["address"])
        if features is None:
            raise CommandError("Geocoding failed!")
        self.stdout.write("Geocoding results:\n\n")
        for feature in features:
            self.stdout.write(
                f"{feature.properties.label} " f"pad_bbl={feature.properties.pad_bbl}\n"
            )
