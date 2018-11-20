from django.db import models

# These models map onto the existing schema roughly defined here:
#
#     https://github.com/aepyornis/nyc-db/blob/master/src/nycdb/datasets.yml


class HPDRegistration(models.Model):
    class Meta:
        db_table = 'hpd_registrations'

    registrationid = models.IntegerField(primary_key=True)
    boroid = models.SmallIntegerField()
    block = models.SmallIntegerField()
    lot = models.SmallIntegerField()


class HPDContact(models.Model):
    class Meta:
        db_table = 'hpd_contacts'

    registrationcontactid = models.IntegerField(primary_key=True)
    registrationid = models.ForeignKey(
        HPDRegistration,
        db_column='registrationid',
        related_name='contacts',
        on_delete=models.CASCADE
    )
    type = models.TextField()
    contactdescription = models.TextField()
    corporationname = models.TextField()
    title = models.TextField()
    firstname = models.TextField()
    middleinitial = models.TextField()
    lastname = models.TextField()
    businesshousenumber = models.TextField()
    businessstreetname = models.TextField()
    businessapartment = models.TextField()
    businesscity = models.TextField()
    businessstate = models.TextField()
    businesszip = models.TextField()
