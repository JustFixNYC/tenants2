from io import StringIO
from django.core.management import call_command

from hpaction import docusign


def test_setting_private_key_works(db):
    assert docusign.get_private_key_bytes() == b''
    call_command('setdocusignkey', stdin=StringIO("boop"))
    assert docusign.get_private_key_bytes() == b'boop'
