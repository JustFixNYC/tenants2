from hpaction.models import DocusignConfig
from hpaction import docusign


def test_configuration_is_created_after_migrations(db):
    assert docusign.get_private_key_bytes() == b''
    cfg = DocusignConfig.objects.get()
    cfg.private_key = 'boop'
    cfg.save()
    assert docusign.get_private_key_bytes() == b'boop'
