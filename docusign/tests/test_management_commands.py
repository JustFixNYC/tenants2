from io import StringIO
from django.core.management import call_command

from docusign import core


def test_setdocusignkey_works(db):
    assert core.get_private_key_bytes() == b""
    call_command("setdocusignkey", stdin=StringIO("boop"))
    assert core.get_private_key_bytes() == b"boop"


def test_testdocusign_works(mockdocusign):
    stdout = StringIO()
    call_command("testdocusign", stdout=stdout)
    assert "integration appears to be working" in stdout.getvalue()
