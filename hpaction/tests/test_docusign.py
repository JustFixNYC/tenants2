from django.contrib.auth.models import AnonymousUser
import pytest

from .factories import (
    HPActionDocumentsFactory,
    HPActionDocumentsForRepairsFactory,
    HPActionDocumentsForHarassmentFactory,
    HPActionDocumentsForBothFactory,
    construct_fake_pdf,
    DocusignEnvelopeFactory
)
from onboarding.tests.factories import OnboardingInfoFactory
from onboarding.models import BOROUGH_CHOICES
from users.tests.factories import JustfixUser
from loc.tests.factories import LandlordDetailsFactory
from hpaction.models import Config
from hpaction import docusign
from hpaction.docusign import HPAType, FormsConfig

ALL_BOROUGHS = BOROUGH_CHOICES.choices_dict.keys()


def set_config(**kwargs):
    config = Config.objects.get()
    for name, value in kwargs.items():
        setattr(config, name, value)
    config.save()


class TestGetHousingCourtForBorough:
    @pytest.mark.parametrize('borough', ALL_BOROUGHS)
    def test_it_returns_none_when_config_does_not_exist(self, db, borough):
        assert docusign.get_housing_court_for_borough(borough) is None

    def test_it_returns_borough_court_when_it_exists(self, db):
        set_config(
            manhattan_court_email="manhattan@courts.gov",
            bronx_court_email="bronx@courts.gov",
            brooklyn_court_email="brooklyn@courts.gov",
            queens_court_email="queens@courts.gov",
            staten_island_court_email="si@courts.gov",
        )
        assert docusign.get_housing_court_for_borough("MANHATTAN") == (
            "Manhattan Housing Court", "manhattan@courts.gov",
        )
        assert docusign.get_housing_court_for_borough("BRONX") == (
            "Bronx Housing Court", "bronx@courts.gov",
        )
        assert docusign.get_housing_court_for_borough("BROOKLYN") == (
            "Brooklyn Housing Court", "brooklyn@courts.gov",
        )
        assert docusign.get_housing_court_for_borough("QUEENS") == (
            "Queens Housing Court", "queens@courts.gov",
        )
        assert docusign.get_housing_court_for_borough("STATEN_ISLAND") == (
            "Staten Island Housing Court", "si@courts.gov",
        )


class TestFormsConfig:
    @pytest.mark.parametrize('hpa_type,num_date_signed_tabs', [
        (HPAType.REPAIRS, 4),
        (HPAType.HARASSMENT, 3),
        (HPAType.BOTH, 4),
    ])
    def test_it_creates_date_signed_tabs(self, hpa_type, num_date_signed_tabs):
        fc = FormsConfig.from_case_type(hpa_type)
        tabs = fc.to_docusign_tabs('blah')
        assert len(tabs.date_signed_tabs) == num_date_signed_tabs


class TestCreateEnvelopeDefinitionForHPA:
    def test_it_works_with_repairs_cases(self, db, django_file_storage):
        docs = HPActionDocumentsForRepairsFactory()
        ed = docusign.create_envelope_definition_for_hpa(docs)
        assert len(ed.documents) == 1
        assert len(ed.recipients.signers) == 1
        assert len(ed.recipients.carbon_copies) == 1

    def test_it_works_with_harassment_cases(self, db, django_file_storage):
        docs = HPActionDocumentsForHarassmentFactory()
        ed = docusign.create_envelope_definition_for_hpa(docs)
        assert len(ed.documents) == 1
        assert len(ed.recipients.signers) == 1
        assert len(ed.recipients.carbon_copies) == 1

    def test_it_works_with_repairs_and_harassment_cases(self, db, django_file_storage):
        docs = HPActionDocumentsForBothFactory()
        ed = docusign.create_envelope_definition_for_hpa(docs)
        assert len(ed.documents) == 1
        assert len(ed.recipients.signers) == 1
        assert len(ed.recipients.carbon_copies) == 1

    def test_it_raises_error_on_unexpected_page_count(self, db, django_file_storage):
        docs = HPActionDocumentsForRepairsFactory(
            pdf_data=construct_fake_pdf(6)
        )
        with pytest.raises(
            ValueError,
            match="Expected HPAType.REPAIRS PDF to have 5 pages but it has 6"
        ):
            docusign.create_envelope_definition_for_hpa(docs)

    def test_it_ccs_housing_court_if_possible(self, db, django_file_storage):
        onb = OnboardingInfoFactory(borough="BRONX")
        docs = HPActionDocumentsFactory(user=onb.user)
        set_config(bronx_court_email="boop@bronx.gov")
        ed = docusign.create_envelope_definition_for_hpa(docs)
        assert len(ed.recipients.carbon_copies) == 2
        hc = ed.recipients.carbon_copies[1]
        assert hc.name == "Bronx Housing Court"
        assert hc.email == "boop@bronx.gov"


class TestGetContactInfo:
    def assert_unknown_info(self, user):
        info = docusign.get_contact_info(user)
        assert "landlord phone: unknown" in info
        assert "landlord email: unknown" in info

    def test_it_works_when_no_landlord_details_exist(self):
        self.assert_unknown_info(JustfixUser())

    def test_it_works_when_landlord_details_are_empty(self, db):
        self.assert_unknown_info(LandlordDetailsFactory().user)

    def test_it_works_when_landlord_details_are_populated(self, db):
        ld = LandlordDetailsFactory(phone_number="5551234567", email="landlordo@gmail.com")
        info = docusign.get_contact_info(ld.user)
        assert "landlord phone: (555) 123-4567" in info
        assert "landlord email: landlordo@gmail.com" in info


@pytest.mark.parametrize('docusign_event,envelope_status', [
    ('signing_complete', 'SIGNED'),
    ('decline', 'DECLINED'),
    ('viewing_complete', 'IN_PROGRESS'),
    ('cancel', 'IN_PROGRESS'),
])
def test_update_envelope_status(db, docusign_event, envelope_status, django_file_storage):
    de = DocusignEnvelopeFactory()
    docusign.update_envelope_status(de, docusign_event)
    de.refresh_from_db()
    assert de.status == envelope_status


class TestCallbackHandler:
    def test_it_returns_none_when_qs_args_do_not_apply(self, rf):
        req = rf.get('/')
        assert docusign.callback_handler(req) is None

    def handler(self, rf, event='myevt', envelope='myeid', next='myurl', user=None):
        url = f"/?type=ehpa&envelope={envelope}&next={next}&event={event}"
        req = rf.get(url)
        req.user = user or AnonymousUser()
        return docusign.callback_handler(req)

    def test_it_returns_400_on_invalid_envelope_id(self, rf, db):
        assert self.handler(rf, envelope='blarg').status_code == 400

    def test_it_returns_403_on_invalid_user(self, rf, db, django_file_storage):
        DocusignEnvelopeFactory(id='boop')
        assert self.handler(rf, envelope='boop').status_code == 403

    def test_it_updates_status_and_redirects_on_success(self, rf, db, django_file_storage):
        de = DocusignEnvelopeFactory(id='boop')
        res = self.handler(
            rf, envelope='boop', event='decline', user=de.docs.user)
        de.refresh_from_db()
        assert de.status == 'DECLINED'
        assert res.status_code == 302
        assert res['Location'] == 'myurl?event=decline'
