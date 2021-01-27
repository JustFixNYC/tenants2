from django.contrib.auth.models import AnonymousUser
from freezegun.api import freeze_time
from evictionfree.views import _get_vars_for_user
from evictionfree.tests.factories import HardshipDeclarationDetailsFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LandlordDetailsV2Factory


def create_user_with_all_info(hdd=None, oinfo=None):
    hdd = HardshipDeclarationDetailsFactory(**(hdd or {}))
    OnboardingInfoFactory(user=hdd.user, **(oinfo or {}))
    LandlordDetailsV2Factory(user=hdd.user)
    return hdd.user


def test_example_declaration_works(client):
    res = client.get("/en/evictionfree/example-declaration.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"


def test_preview_declaration_raises_404_for_logged_out_users(client):
    res = client.get("/en/evictionfree/preview-declaration.pdf")
    assert res.status_code == 404


def test_preview_declaration_renders_for_users_with_declaration_info(
    client, db, fake_fill_hardship_pdf
):
    user = create_user_with_all_info()
    client.force_login(user)
    res = client.get("/en/evictionfree/preview-declaration.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"


def test_preview_cover_letter_raises_404_for_logged_out_users(client):
    res = client.get("/en/evictionfree/preview-cover-letter.pdf")
    assert res.status_code == 404


def test_preview_cover_letter_renders_for_users_with_declaration_info(client, db):
    user = create_user_with_all_info()
    client.force_login(user)
    res = client.get("/en/evictionfree/preview-cover-letter.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"


class TestGetVarsForUser:
    def test_it_returns_none_for_anonymous_users(self):
        assert _get_vars_for_user(AnonymousUser()) is None

    def test_it_works_for_users_with_all_info(self, db):
        user = create_user_with_all_info(
            hdd=dict(
                index_number="myindex",
                has_financial_hardship=True,
            )
        )
        with freeze_time("2021-01-25"):
            v = _get_vars_for_user(user)
        assert v is not None
        assert v.index_number == "myindex"
        assert v.address == "150 court street, Apartment 2, Brooklyn, NY"
        assert v.has_financial_hardship is True
        assert v.has_health_risk is False
        assert v.name == "Boop Jones"
        assert v.date == "01/25/2021"
