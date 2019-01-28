from django.core.management import call_command

from findhelp.models import Zipcode


def test_it_works(db):
    call_command('loadfindhelpdata')
    assert Zipcode.objects.get(zipcode='11201') is not None
