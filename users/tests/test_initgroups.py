from io import StringIO
from django.core.management import call_command


GROUP_DOES_NOT_EXIST_SENTINEL = "Group does not exist, creating it"


def test_initgroups_works(db):
    out = StringIO()
    call_command("initgroups", stdout=out)
    assert GROUP_DOES_NOT_EXIST_SENTINEL in out.getvalue()

    out = StringIO()
    call_command("initgroups", stdout=out)
    assert GROUP_DOES_NOT_EXIST_SENTINEL not in out.getvalue()
