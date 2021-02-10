from users.models import JustfixUser
from project.util import data_dictionary as dd


def test_it_uses_hard_coded_docs():
    qs = JustfixUser.objects.values("id")
    d = dd.get_data_dictionary(qs)
    assert "unique id" in d["id"]


def test_it_uses_help_text_from_model():
    qs = JustfixUser.objects.values("phone_number")
    d = dd.get_data_dictionary(qs)
    assert "phone number" in d["phone_number"]


def test_it_prioritizes_passed_in_docs():
    qs = JustfixUser.objects.values("phone_number")
    d = dd.get_data_dictionary(qs, {"phone_number": "blarg"})
    assert d == {"phone_number": "blarg"}
