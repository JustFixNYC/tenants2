from django.contrib.auth.models import AnonymousUser
from evictionfree.views import _get_vars_for_user
from evictionfree.tests.factories import HardshipDeclarationDetailsFactory
from onboarding.tests.factories import OnboardingInfoFactory


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
    hdd = HardshipDeclarationDetailsFactory()
    OnboardingInfoFactory(user=hdd.user)
    client.force_login(hdd.user)
    res = client.get("/en/evictionfree/preview-declaration.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"


class TestGetVarsForUser:
    def test_it_returns_none_for_anonymous_users(self):
        assert _get_vars_for_user(AnonymousUser()) is None
