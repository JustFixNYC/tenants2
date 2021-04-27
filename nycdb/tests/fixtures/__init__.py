from pathlib import Path
from django.core import serializers

from nycdb.models import HPDRegistration


FIXTURES_DIR = Path(__file__).parent.resolve()


def load_hpd_registration(filename: str) -> HPDRegistration:
    """
    Load the given fixture and return the first model instance in it.
    """

    path = FIXTURES_DIR / filename
    first_obj = None
    for obj in serializers.deserialize("json", path.read_text()):
        obj.save()
        if first_obj is None:
            first_obj = obj.object
    assert isinstance(first_obj, HPDRegistration)
    return first_obj
