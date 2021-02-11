from django.db.models import Exists, OuterRef, F

from users.models import JustfixUser
from onboarding.models import OnboardingInfo
from project.util import data_dictionary as dd


example_subquery = Exists(OnboardingInfo.objects.filter(user=OuterRef("pk")))

example_entry = dd.DataDictionaryEntry("flarg", choices=[("value", "label")])


def test_it_uses_hard_coded_docs():
    qs = JustfixUser.objects.values("id")
    d = dd.get_data_dictionary(qs)
    assert "unique id" in d["id"].help_text


def test_it_uses_help_text_from_model():
    qs = JustfixUser.objects.values("phone_number")
    d = dd.get_data_dictionary(qs)
    assert "phone number" in d["phone_number"].help_text


def test_it_prioritizes_passed_in_docs():
    qs = JustfixUser.objects.values("phone_number")
    d = dd.get_data_dictionary(qs, {"phone_number": "blarg"})
    assert d["phone_number"].help_text == "blarg"


def test_it_uses_passed_in_docs_for_annotations():
    qs = JustfixUser.objects.values(has_onboarding_info=example_subquery)
    d = dd.get_data_dictionary(qs, {"has_onboarding_info": "Whether the user has been onboarded."})
    assert d["has_onboarding_info"].help_text == "Whether the user has been onboarded."


def test_it_defaults_annotation_docs_to_empty_strings():
    qs = JustfixUser.objects.values(has_onboarding_info=example_subquery)
    d = dd.get_data_dictionary(qs)
    assert d["has_onboarding_info"].help_text == ""


def test_it_uses_help_text_from_model_for_annotations_if_possible():
    qs = JustfixUser.objects.values(bloop=F("phone_number"))
    d = dd.get_data_dictionary(qs)
    assert "phone number" in d["bloop"].help_text


def test_it_prioritizes_passed_in_docs_for_annotations_if_possible():
    qs = JustfixUser.objects.values(bloop=F("phone_number"))
    d = dd.get_data_dictionary(qs, {"bloop": "hallo"})
    assert d["bloop"].help_text == "hallo"


def test_it_uses_data_dict_entries_in_passed_in_docs_for_renamed_fields():
    qs = JustfixUser.objects.values(bloop=F("phone_number"))
    d = dd.get_data_dictionary(qs, {"bloop": example_entry})
    assert d["bloop"] is example_entry


def test_it_uses_data_dict_entries_in_passed_in_docs_for_annotations():
    qs = JustfixUser.objects.values(bloop=example_subquery)
    d = dd.get_data_dictionary(qs, {"bloop": example_entry})
    assert d["bloop"] is example_entry


def test_it_uses_data_dict_entries_in_passed_in_docs_for_columns():
    qs = JustfixUser.objects.values("phone_number")
    d = dd.get_data_dictionary(qs, {"phone_number": example_entry})
    assert d["phone_number"] is example_entry
