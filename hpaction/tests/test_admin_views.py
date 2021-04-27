from django.core.exceptions import ValidationError
from django.urls import reverse
import pytest

from project.tests.test_mailing_address import EXAMPLE_KWARGS as ADDRESS_KWARGS
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LandlordDetailsV2Factory
from .factories import ONE_PAGE_PDF
from hpaction.models import ServingPapers
from hpaction.admin_views import ServingPapersForm


class TestServingPapersForm:
    # Ok, the PDF file field isn't filled, so this isn't technically
    # correct, but mocking file fields is hard so whatever.
    FILLED_FORM_DATA = {
        "name": "Landlordo Calrissian",
        **ADDRESS_KWARGS,
        "is_definitely_deliverable": False,
    }

    def test_no_validation_is_done_if_address_is_not_populated(self, mocklob):
        ServingPapersForm.validate_address({"is_definitely_deliverable": False})
        assert mocklob.verifications_mock.called is False

    def test_validation_works_when_addr_is_valid(self, mocklob):
        ServingPapersForm.validate_address(self.FILLED_FORM_DATA)
        assert mocklob.verifications_mock.called is True

    def simulate_undeliverable_addr(self, mocklob):
        mocklob.mock_verifications_api(
            json=mocklob.get_sample_verification(deliverability="undeliverable")
        )

    def test_validation_fails_when_addr_is_invalid(self, mocklob):
        self.simulate_undeliverable_addr(mocklob)
        with pytest.raises(ValidationError, match="address is undeliverable"):
            ServingPapersForm.validate_address(self.FILLED_FORM_DATA)

    def test_validation_succeeds_when_is_definitely_deliverable_is_checked(self, mocklob):
        self.simulate_undeliverable_addr(mocklob)
        ServingPapersForm.validate_address(
            {
                **self.FILLED_FORM_DATA,
                "is_definitely_deliverable": True,
            }
        )
        assert mocklob.verifications_mock.called is False

    def test_clean_works(self, mocklob):
        form = ServingPapersForm(data=self.FILLED_FORM_DATA)
        form.is_valid()
        assert list(form.errors.keys()) == ["pdf_file"]
        assert mocklob.verifications_mock.called is True


def get_create_url(userid):
    return reverse("admin:create-serving-papers", kwargs={"userid": userid})


class TestCreateServingPapersViewPermissions:
    def ensure_access_is_denied(self, client):
        res = client.get(get_create_url(1))
        assert res.status_code == 302
        assert res["Location"].startswith("/admin/login/")

    def test_it_denies_anonymous_users(self, client):
        self.ensure_access_is_denied(client)

    def test_it_denies_non_staff_users(self, client, db):
        user = OnboardingInfoFactory().user
        client.force_login(user)
        self.ensure_access_is_denied(client)


class TestCreateServingPapersView:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, admin_client, disable_locale_middleware, settings):
        # Seems like we need this to get the actual Http404 reasons.
        settings.DEBUG = True

        self.db = db
        self.client = admin_client

    @pytest.fixture
    def sender(self):
        onb = OnboardingInfoFactory()
        user = onb.user
        LandlordDetailsV2Factory(user=user)
        return user

    def test_it_raises_404_if_lob_is_disabled(self):
        res = self.client.get(get_create_url(1))
        assert res.status_code == 404
        # https://code.djangoproject.com/ticket/32637
        # assert b"Lob integration is disabled" in res.content

    def test_it_raises_404_if_user_does_not_exist(self, mocklob):
        res = self.client.get(get_create_url(51929))
        assert res.status_code == 404
        # https://code.djangoproject.com/ticket/32637
        # assert b"User not found" in res.content

    def test_get_works(self, mocklob, sender):
        res = self.client.get(get_create_url(sender.pk))
        assert res.status_code == 200
        assert res.context["go_back_href"].startswith("/admin/hpaction/hpuser/")
        assert res.context["form"].initial["name"] == "Landlordo Calrissian"

    def test_post_with_form_errors_works(self, mocklob, sender):
        res = self.client.post(get_create_url(sender.pk))
        assert res.status_code == 200
        assert res.context["form"].errors["pdf_file"] == ["This field is required."]

    def test_post_redirects_when_successful(self, mocklob, sender, django_file_storage):
        res = self.client.post(
            get_create_url(sender.pk),
            {"name": "Landlordo", **ADDRESS_KWARGS, "pdf_file": ONE_PAGE_PDF.open("rb")},
        )
        assert res.status_code == 302
        assert res["Location"].startswith("/admin/hpaction/hpuser/")
        sp = ServingPapers.objects.get(sender=sender)
        assert sp.name == "Landlordo"
        assert sp.pdf_file.open().read()
        assert sp.tracking_number == mocklob.sample_letter["tracking_number"]

        # It would be great if we could verify that the uploader is the
        # admin_client user but that is apparently hard, so we'll just
        # verify it's populated.
        assert sp.uploaded_by is not None
