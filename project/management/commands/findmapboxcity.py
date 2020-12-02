from django.core.management.base import BaseCommand

from project import mapbox


class Command(BaseCommand):
    help = "Search for a city using the Mapbox Places API."

    def add_arguments(self, parser):
        parser.add_argument("city")
        parser.add_argument("state")

    def handle(self, *args, **options):
        city: str = options["city"]
        state: str = options["state"]

        print(mapbox.find_city(city, state))
