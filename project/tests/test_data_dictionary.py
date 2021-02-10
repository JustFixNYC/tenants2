from django.db.models import Exists, OuterRef

from users.models import JustfixUser
from onboarding.models import OnboardingInfo
from project.util import data_dictionary as dd


example_subquery = Exists(OnboardingInfo.objects.filter(user=OuterRef("pk")))


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


def test_it_uses_passed_in_docs_for_annotations():
    qs = JustfixUser.objects.values(has_onboarding_info=example_subquery)
    d = dd.get_data_dictionary(qs, {"has_onboarding_info": "Whether the user has been onboarded."})
    assert d == {"has_onboarding_info": "Whether the user has been onboarded."}


def test_it_defaults_annotation_docs_to_empty_strings():
    qs = JustfixUser.objects.values(has_onboarding_info=example_subquery)
    d = dd.get_data_dictionary(qs)
    assert d == {"has_onboarding_info": ""}
