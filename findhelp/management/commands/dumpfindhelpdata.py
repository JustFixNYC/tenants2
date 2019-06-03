import csv
from django.core.management.base import BaseCommand

from findhelp.models import (
    Zipcode, Borough, Neighborhood, CommunityDistrict)


class Command(BaseCommand):
    help = 'Exports NYC geographic data as CSV.'

    def write_csv(self, model, colnames):
        filename = f"{model.__name__.lower()}s.csv"
        self.stdout.write(f"Writing {filename}.")
        with open(filename, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(colnames)
            for record in model.objects.all():
                row = [
                    str(getattr(record, colname))
                    for colname in colnames
                ]
                writer.writerow(row)

    def handle(self, *args, **options):
        self.write_csv(Neighborhood, ('name', 'county'))
        self.write_csv(Zipcode, ('zipcode',))
        self.write_csv(Borough, ('name',))
        self.write_csv(CommunityDistrict, ('boro_cd', 'name'))
