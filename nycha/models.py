from typing import Optional
from django.db import models


class NychaOfficeManager(models.Manager):
    def find_for_property(self, pad_bbl: str, address: str) -> Optional['NychaOffice']:
        offices_for_bbl = self.filter(properties__pad_bbl=pad_bbl).distinct()
        count = offices_for_bbl.count()
        if count == 0:
            return None
        elif count == 1:
            return offices_for_bbl.get()
        else:
            addr_beginning_upper = address.split(',')[0].upper()
            offices_for_address = offices_for_bbl.filter(
                properties__address=addr_beginning_upper)
            if offices_for_address.exists():
                return offices_for_address.first()
            return offices_for_bbl.first()


class NychaOffice(models.Model):
    name = models.CharField(
        max_length=255,
        help_text="The name of the management entity."
    )

    address = models.TextField(
        help_text="The full mailing address of the management office."
    )

    objects = NychaOfficeManager()


class NychaProperty(models.Model):
    class Meta:
        unique_together = ('pad_bbl', 'address')

    pad_bbl = models.CharField(
        max_length=10,  # One for the borough, 5 for the block, 4 for the lot.
        help_text="The zero-padded borough, block and lot (BBL) number for the NYCHA property."
    )

    address = models.CharField(
        max_length=100,
        help_text="The street address of the NYCHA property."
    )

    office = models.ForeignKey(
        NychaOffice,
        on_delete=models.CASCADE,
        related_name='properties',
        help_text="The NYCHA office that manages the property."
    )
