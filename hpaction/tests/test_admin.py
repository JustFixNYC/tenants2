from users.tests.factories import UserFactory
from users.tests.test_admin_user_proxy import UserProxyAdminTester
from .factories import HPActionDocumentsFactory, HPActionDetailsFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LandlordDetailsV2Factory
from hpaction.models import HPActionDocuments
from hpaction.admin import schedule_for_deletion, HPUserAdmin


def test_schedule_for_deletion_works(db, django_file_storage):
    doc = HPActionDocumentsFactory()
    assert doc.user is not None
    schedule_for_deletion(None, None, HPActionDocuments.objects.all())
    doc.refresh_from_db()
    assert doc.user is None


def test_edit_user_field_works(db):
    user = UserFactory()
    url = HPUserAdmin.edit_user(None, user)
    assert str(user.id) in url


class TestHPUserAdmin(UserProxyAdminTester):
    list_view_url = '/admin/hpaction/hpuser/'

    def create_user(self):
        return HPActionDetailsFactory().user


class TestCreateServingPapersField:
    def test_it_reports_when_lob_is_disabled(self):
        assert HPUserAdmin.create_serving_papers(None, None) == "Lob integration is disabled."

    def test_it_reports_when_user_is_ineligible(self, db, mocklob):
        user = UserFactory()
        assert "We don't have enough information" in HPUserAdmin.create_serving_papers(
            None, user)

    def test_it_renders_link(self, db, mocklob):
        user = OnboardingInfoFactory().user
        LandlordDetailsV2Factory(user=user)
        assert "/admin/serving-papers/create/" in HPUserAdmin.create_serving_papers(
            None, user)
