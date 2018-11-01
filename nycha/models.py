from django.db import models


class NychaOffice(models.Model):
    name = models.CharField(
        max_length=255,
        help_text="The name of the management entity."
    )

    address = models.TextField(
        help_text="The full mailing address of the management office."
    )


class NychaProperty(models.Model):
    pad_bbl = models.CharField(
        max_length=10,  # One for the borough, 5 for the block, 4 for the lot.
        unique=True,
        help_text="The zero-padded borough, block and lot (BBL) number for the NYCHA property."
    )

    office = models.ForeignKey(
        NychaOffice,
        on_delete=models.CASCADE,
        related_name='properties',
        help_text="The NYCHA office that manages the property."
    )
