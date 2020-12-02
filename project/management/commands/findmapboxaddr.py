from django.core.management.base import BaseCommand

from project import mapbox


class Command(BaseCommand):
    help = "Search for an address using the Mapbox Places API."

    def add_arguments(self, parser):
        parser.add_argument("address")
        parser.add_argument("city")
        parser.add_argument("state")
        parser.add_argument("zip_code")

    def handle(self, *args, **options):
        address: str = options["address"]
        city: str = options["city"]
        state: str = options["state"].upper()
        zip_code: str = options["zip_code"]
        print(mapbox.find_address(address, city, state, zip_code))
