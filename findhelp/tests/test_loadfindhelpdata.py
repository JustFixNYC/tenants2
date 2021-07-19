from django.core.management import call_command

from findhelp.models import Zipcode, is_lnglat_in_nyc
from .factories import LngLats


def test_it_works(db):
    call_command("loadfindhelpdata")
    assert Zipcode.objects.get(zipcode="11201") is not None

    # Because our temporary 'loadfindhelpcbos' command depends
    # on 'loadfindhelpdata', we'll just smoke test it now too.
    call_command("loadfindhelpcbos")

    # This is a bit annoying; is_lnglat_in_nyc() depends on
    # the borough data being loaded, which is what has just
    # been done.  We don't want to have to load it in a
    # separate test because that would make our test suite
    # take seconds longer to run, which we'd rather not have,
    # so we're just going to test the function here.
    assert is_lnglat_in_nyc(LngLats.BROOKLYN_HEIGHTS) is True
    assert is_lnglat_in_nyc(LngLats.ALBANY) is False
    assert is_lnglat_in_nyc(LngLats.YONKERS) is False
