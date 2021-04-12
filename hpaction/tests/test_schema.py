from decimal import Decimal
from typing import Dict, Any
from django.test import override_settings
import pytest

from project.util.testing_util import one_field_err, TestWithGraphQL, GraphQLTestingPal
from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from issues.models import Issue, CustomIssue, ISSUE_CHOICES, ISSUE_AREA_CHOICES
from loc.tests import test_landlord_lookup
from loc.tests.factories import LandlordDetailsV2Factory
from .factories import (
    UploadTokenFactory,
    FeeWaiverDetailsFactory,
    TenantChildFactory,
    HPActionDocumentsFactory,
    DocusignEnvelopeFactory,
    ManagementCompanyDetailsFactory,
)
from hpaction.models import (
    get_upload_status_for_user,
    HPUploadStatus,
    TenantChild,
    HP_ACTION_CHOICES,
    DocusignEnvelope,
)
from hpaction.schema import sync_emergency_issues
from .test_build_hpactionvars import onboarding_info_pad_kwarg
import hpaction.docusign


NORMAL = HP_ACTION_CHOICES.NORMAL


def execute_tenant_children_mutation(graphql_client, children):
    return graphql_client.execute(
        """
        mutation MyMutation($input: TenantChildrenInput!) {
            output: tenantChildren(input: $input) {
                errors { field, messages }
            }
        }
        """,
        variables={"input": {"children": children}},
    )["data"]["output"]


def test_tenant_children_mutation_requires_login(db, graphql_client):
    result = execute_tenant_children_mutation(graphql_client, [])
    assert result["errors"] == one_field_err("You do not have permission to use this form!")


class TestSyncEmergencyIssues:
    def test_it_works(self, db):
        HOME = ISSUE_AREA_CHOICES.HOME
        DOORBELL = ISSUE_CHOICES.HOME__DOORBELL_BROKEN
        NO_HEAT = ISSUE_CHOICES.HOME__NO_HEAT
        NO_HOT_WATER = ISSUE_CHOICES.HOME__NO_HOT_WATER

        user = UserFactory()
        Issue.objects.set_area_issues_for_user(user, HOME, [DOORBELL])

        def gethomeissues():
            return set(Issue.objects.get_area_issues_for_user(user, HOME))

        sync_emergency_issues(user, [NO_HEAT])
        assert gethomeissues() == {NO_HEAT, DOORBELL}
        sync_emergency_issues(user, [NO_HOT_WATER])
        assert gethomeissues() == {NO_HOT_WATER, DOORBELL}


class TestEmergencyHPAIssuesMutation:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.user = UserFactory()
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def execute(self, input):
        return self.graphql_client.execute(
            """
            mutation MyMutation($input: EmergencyHPAIssuesInput!) {
                output: emergencyHpaIssues(input: $input) {
                    errors { field, messages }
                    session { issues, customIssuesV2 { area, description } }
                }
            }
            """,
            variables={"input": input},
        )["data"]["output"]

    def test_it_works(self):
        result = self.execute({"issues": ["HOME__NO_HEAT"], "customHomeIssues": []})
        assert result["session"]["issues"] == ["HOME__NO_HEAT"]

    def test_it_works_when_a_custom_issue_is_selected(self):
        result = self.execute(
            {"issues": [], "customHomeIssues": [{"description": "boop", "DELETE": False}]}
        )
        assert result["session"]["customIssuesV2"] == [
            {
                "area": "HOME",
                "description": "boop",
            }
        ]

    def test_it_raises_error_when_nothing_is_selected_after_deletion(self):
        ci = CustomIssue(user=self.user, area=ISSUE_AREA_CHOICES.HOME, description="hi")
        ci.save()
        input = {
            "issues": [],
            "customHomeIssues": [{"description": "", "DELETE": True, "id": ci.id}],
        }
        result = self.execute(input)
        assert result["errors"] == one_field_err("Please choose at least one option.")

        # Now add a regular issue, it should work and delete the custom one.
        input["issues"] = ["HOME__NO_HEAT"]
        assert self.execute(input)["errors"] == []
        assert CustomIssue.objects.filter(pk=ci.id).first() is None

    def test_it_raises_error_when_nothing_is_selected(self):
        result = self.execute({"issues": [], "customHomeIssues": []})
        assert result["errors"] == one_field_err("Please choose at least one option.")


class TestTenantChildrenSession:
    def query(self, graphql_client):
        return graphql_client.execute(
            """
            query {
                session {
                    tenantChildren {
                        id,
                        name,
                        dob
                    }
                }
            }
            """
        )["data"]["session"]["tenantChildren"]

    def test_it_returns_none_if_not_logged_in(self, graphql_client):
        assert self.query(graphql_client) is None

    def test_it_returns_list_if_logged_in(self, db, graphql_client):
        child = TenantChildFactory()
        graphql_client.request.user = child.user
        results = self.query(graphql_client)
        assert len(results) == 1
        r = results[0]
        assert r["id"] == str(child.id)
        assert r["name"] == child.name
        assert r["dob"] == "2001-10-11"


class TestTenantChildrenMutation:
    BLANK_INPUT = {"name": "", "dob": "", "DELETE": False}

    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client):
        user = UserFactory.create()
        graphql_client.request.user = user
        self.graphql_client = graphql_client

    def mutate(self, children, ensure_success=False):
        result = execute_tenant_children_mutation(self.graphql_client, children)
        if ensure_success:
            assert result["errors"] == []
        return result

    def get_children(self):
        return list(TenantChild.objects.all())

    def test_submitting_empty_list_does_nothing(self):
        self.mutate([], ensure_success=True)
        assert len(self.get_children()) == 0

    def test_adding_and_removing_child_works(self):
        # Ensure adding a child works.
        self.mutate(
            [
                {
                    **self.BLANK_INPUT,
                    "name": "Boop Jones Jr.",
                    "dob": "10/12/2001",
                }
            ],
            ensure_success=True,
        )
        children = self.get_children()
        assert len(children) == 1

        # Ensure submitting a blank form does nothing.
        self.mutate([], ensure_success=True)
        assert len(self.get_children()) == 1

        # Ensure deleting the child works.
        self.mutate(
            [{**self.BLANK_INPUT, "id": str(children[0].id), "DELETE": True}], ensure_success=True
        )
        assert len(self.get_children()) == 0

    def test_submitting_blank_form_does_nothing(self):
        self.mutate([self.BLANK_INPUT], ensure_success=True)
        assert len(self.get_children()) == 0

    def test_submitting_incomplete_form_reports_errors(self):
        result = self.mutate(
            [
                {
                    **self.BLANK_INPUT,
                    "name": "Blarf",
                }
            ]
        )
        assert len(result["errors"]) > 0
        assert len(self.get_children()) == 0


def execute_genpdf_mutation(graphql_client, **input):
    return graphql_client.execute(
        """
        mutation MyMutation($input: GenerateHpActionPdfInput!) {
            output: generateHpActionPdf(input: $input) {
                errors { field, messages }
                session { latestHpActionPdfUrl }
            }
        }
        """,
        variables={"input": {"kind": "NORMAL", **input}},
    )["data"]["output"]


class TestGenerateHPActionPDF:
    def test_it_requires_auth(self, graphql_client):
        result = execute_genpdf_mutation(graphql_client)
        assert result["errors"] == one_field_err("You do not have permission to use this form!")

    @pytest.mark.django_db
    def test_it_errors_if_hpaction_is_disabled(self, graphql_client):
        user = UserFactory.create()
        graphql_client.request.user = user
        result = execute_genpdf_mutation(graphql_client)
        assert result["errors"] == []
        assert get_upload_status_for_user(user, NORMAL) == HPUploadStatus.ERRORED

    @pytest.mark.django_db
    @override_settings(HP_ACTION_CUSTOMER_KEY="boop")
    def test_it_works(self, graphql_client, fake_soap_call, django_file_storage):
        user = UserFactory.create()
        graphql_client.request.user = user
        fake_soap_call.simulate_success(user)
        result = execute_genpdf_mutation(graphql_client)
        assert result["errors"] == []
        assert get_upload_status_for_user(user, NORMAL) == HPUploadStatus.SUCCEEDED


class TestSessionPdfInfo:
    def execute(self, graphql_client):
        return graphql_client.execute(
            "query { session { latestHpActionPdfUrl, hpActionUploadStatus } }"
        )["data"]["session"]

    def test_it_works_if_unauthenticated(self, graphql_client):
        assert self.execute(graphql_client) == {
            "latestHpActionPdfUrl": None,
            "hpActionUploadStatus": "NOT_STARTED",
        }

    @pytest.mark.django_db
    def test_it_works_if_logged_in_but_not_started(self, graphql_client):
        graphql_client.request.user = UserFactory.create()
        assert self.execute(graphql_client) == {
            "latestHpActionPdfUrl": None,
            "hpActionUploadStatus": "NOT_STARTED",
        }

    @pytest.mark.django_db
    def test_it_works_if_started(self, graphql_client):
        tok = UploadTokenFactory()
        graphql_client.request.user = tok.user
        assert self.execute(graphql_client) == {
            "latestHpActionPdfUrl": None,
            "hpActionUploadStatus": "STARTED",
        }


class TestSessionFeeWaiverInfo:
    def execute(self, graphql_client):
        return graphql_client.execute("query { session { feeWaiver { incomeAmountMonthly } } }")[
            "data"
        ]["session"]

    def test_it_works_if_unauthenticated(self, graphql_client):
        assert self.execute(graphql_client) == {
            "feeWaiver": None,
        }

    def test_it_works_if_started(self, graphql_client, db):
        fw = FeeWaiverDetailsFactory(income_amount_monthly=Decimal("3.15"))
        graphql_client.request.user = fw.user
        assert self.execute(graphql_client) == {"feeWaiver": {"incomeAmountMonthly": '3.15'}}


EMAIL_PACKET_GRAPHQL = """
mutation {
    emailHpActionPdf(input: {recipients: [{email: "boop@jones.com"}]}) {
        errors { field, messages }
        recipients
    }
}
"""


def test_email_packet_works(db, graphql_client, mailoutbox, django_file_storage):
    graphql_client.request.user = HPActionDocumentsFactory().user
    result = graphql_client.execute(EMAIL_PACKET_GRAPHQL)["data"]["emailHpActionPdf"]
    assert result == {"errors": [], "recipients": ["boop@jones.com"]}
    assert len(mailoutbox) == 1


def test_email_packet_errors_if_no_packet_exists(db, graphql_client):
    graphql_client.request.user = UserFactory()
    result = graphql_client.execute(EMAIL_PACKET_GRAPHQL)["data"]["emailHpActionPdf"]
    assert result["errors"][0]["messages"] == ["You do not have an HP Action packet to send!"]


class TestBeginDocusign:
    GRAPHQL = """
    mutation {
        beginDocusign(input: {nextUrl: "/blop"}) {
            errors { field, messages }
            redirectUrl
        }
    }
    """

    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client, monkeypatch):
        self.user = UserFactory(email="boop@jones.com", is_email_verified=True)
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client
        self.fake_create_envelope_called = False
        self.fake_create_recipient_view_called = False
        monkeypatch.setattr(
            hpaction.docusign, "create_envelope_for_hpa", self._fake_create_envelope
        )
        monkeypatch.setattr(
            hpaction.docusign, "create_recipient_view_for_hpa", self._fake_create_recipient_view
        )

    def execute(self):
        return self.graphql_client.execute(self.GRAPHQL)["data"]["beginDocusign"]

    def _fake_create_envelope(self, envelope_definition, api_client):
        self.fake_create_envelope_called = True
        return "fake_envelope_id"

    def _fake_create_recipient_view(self, user, envelope_id, api_client, return_url):
        self.fake_create_recipient_view_called = True
        assert return_url.startswith("https://example.com/docusign/callback?")
        assert user.pk == self.user.pk
        return "https://fake-docusign"

    def ensure_error(self, message):
        assert self.execute()["errors"] == one_field_err(message)

    def test_it_raises_error_on_no_email(self):
        self.user.email = ""
        self.user.save()
        self.ensure_error("You have no email address!")

    def test_it_raises_error_on_unverified_email(self):
        self.user.is_email_verified = False
        self.user.save()
        self.ensure_error("Your email address is not verified!")

    def test_it_raises_error_on_no_docs(self):
        self.ensure_error("You have no HP Action documents to sign!")

    def test_it_works(self, mockdocusign, django_file_storage):
        HPActionDocumentsFactory(user=self.user, kind="EMERGENCY")
        result = self.execute()
        assert result == {"errors": [], "redirectUrl": "https://fake-docusign"}
        assert self.fake_create_envelope_called is True
        assert self.fake_create_recipient_view_called is True
        DocusignEnvelope.objects.get(id="fake_envelope_id")

    def test_it_reuses_existing_envelope(self, mockdocusign, django_file_storage):
        docs = HPActionDocumentsFactory(user=self.user, kind="EMERGENCY")
        DocusignEnvelopeFactory(docs=docs, id="boop")
        result = self.execute()
        assert result == {"errors": [], "redirectUrl": "https://fake-docusign"}
        assert self.fake_create_envelope_called is False
        assert self.fake_create_recipient_view_called is True
        DocusignEnvelope.objects.get(id="boop")


class TestEmergencyHPActionSigningStatus:
    GRAPHQL = "query { session { emergencyHpActionSigningStatus } }"

    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client, monkeypatch):
        self.user = UserFactory()
        self.anon = graphql_client.request.user
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def execute(self):
        return self.graphql_client.execute(self.GRAPHQL)["data"]["session"][
            "emergencyHpActionSigningStatus"
        ]

    def test_it_returns_none_on_anon_user(self):
        self.graphql_client.request.user = self.anon
        assert self.execute() is None

    def test_it_returns_none_when_no_docs_exist(self):
        assert self.execute() is None

    def test_it_returns_none_when_no_envelopes_exist(self, django_file_storage):
        HPActionDocumentsFactory(user=self.user, kind="EMERGENCY")
        assert self.execute() is None

    def test_it_returns_none_when_envelope_exists(self, django_file_storage):
        docs = HPActionDocumentsFactory(user=self.user, kind="EMERGENCY")
        DocusignEnvelopeFactory(docs=docs)
        assert self.execute() == "IN_PROGRESS"


class TestRecommendedHpLandlordAndManagementCompany:
    QUERY = """
    query {
        recommendedHpLandlord {
            name,
            primaryLine,
            city,
            state,
            zipCode
        }
        recommendedHpManagementCompany {
            name,
            primaryLine,
            city,
            state,
            zipCode
        }
    }
    """

    def test_they_return_none_for_logged_out_users(self, graphql_client):
        res = graphql_client.execute(self.QUERY)
        assert res["data"] == {
            "recommendedHpLandlord": None,
            "recommendedHpManagementCompany": None,
        }

    def test_they_return_none_when_user_has_no_recommendation(self, db, graphql_client):
        graphql_client.request.user = UserFactory()
        res = graphql_client.execute(self.QUERY)
        assert res["data"] == {
            "recommendedHpLandlord": None,
            "recommendedHpManagementCompany": None,
        }

    def test_they_return_recommendations(self, db, graphql_client, nycdb):
        med = nycdb.load_hpd_registration("medium-landlord.json")
        oinfo = OnboardingInfoFactory(**onboarding_info_pad_kwarg(med, True))
        graphql_client.request.user = oinfo.user
        res = graphql_client.execute(self.QUERY)
        import pprint

        pprint.pprint(res["data"])
        assert res["data"] == {
            "recommendedHpLandlord": {
                "city": "BROOKLYN",
                "name": "ULTRA DEVELOPERS, LLC",
                "primaryLine": "3 ULTRA STREET",
                "state": "NY",
                "zipCode": "11999",
            },
            "recommendedHpManagementCompany": {
                "city": "NEW YORK",
                "name": "FUNKY APARTMENT MANAGEMENT",
                "primaryLine": "900 EAST 25TH STREET #2",
                "state": "NY",
                "zipCode": "10099",
            },
        }


class TestManagementCompanyDetails(TestWithGraphQL):
    QUERY = """
    query {
        session {
            managementCompanyDetails {
                name,
                city,
                primaryLine,
                state,
                zipCode
            }
        }
    }
    """

    def execute(self):
        result = self.graphql_client.execute(self.QUERY)
        return result["data"]["session"]["managementCompanyDetails"]

    def test_it_returns_none_when_logged_out(self):
        assert self.execute() is None

    def test_it_returns_info_when_logged_in(self):
        mc = ManagementCompanyDetailsFactory()
        self.graphql_client.request.user = mc.user
        assert self.execute() == {
            "city": "Chicago",
            "name": "Parker-Holsman",
            "primaryLine": "5113 S. Harper Ave #2C",
            "state": "IL",
            "zipCode": "60615",
        }


class TestHpaLandlordInfo(GraphQLTestingPal):
    QUERY = """
    mutation HpaLandlordInfoMutation($input: HpaLandlordInfoInput!) {
        output: hpaLandlordInfo(input: $input) {
            errors { field, messages },
            session {
                landlordDetails {
                    name,
                    primaryLine,
                    city,
                    state,
                    zipCode,
                    isLookedUp
                }
                managementCompanyDetails {
                    name,
                    primaryLine,
                    city,
                    state,
                    zipCode
                }
            }
        }
    }
    """

    DEFAULT_INPUT = {
        "useRecommended": True,
        "useMgmtCo": False,
        "landlord": [],
        "mgmtCo": [],
    }

    LANDLORD_ADDRESS = "124 99TH STREET\nBrooklyn, NY 11999"

    LANDLORD_DETAILS: Dict[str, Any] = {
        "name": "BOOP JONES",
        "primaryLine": "124 99TH STREET",
        "city": "Brooklyn",
        "state": "NY",
        "zipCode": "11999",
    }

    MGMT_CO_DETAILS = {
        "name": "Nice Management",
        "primaryLine": "123 Main Street",
        "city": "Boopville",
        "state": "NY",
        "zipCode": "12345",
    }

    EMPTY_MAILING_ADDRESS = {
        "name": "",
        "primaryLine": "",
        "city": "",
        "state": "",
        "zipCode": "",
    }

    MISSING_ZIP_CODE_MAILING_ADDRESS = {
        **MGMT_CO_DETAILS,
        "zipCode": "",
    }

    def test_it_requires_login(self):
        self.assert_one_field_err("You do not have permission to use this form!")

    @pytest.mark.parametrize("ll_details_exist", [True, False])
    @test_landlord_lookup.enable_fake_landlord_lookup
    def test_it_sets_recommended_landlord(self, requests_mock, nycdb, ll_details_exist):
        test_landlord_lookup.mock_lookup_success(requests_mock, nycdb)
        onb = OnboardingInfoFactory()
        if ll_details_exist:
            LandlordDetailsV2Factory(user=onb.user)
        self.set_user(onb.user)
        result = self.execute(input={"useRecommended": True})
        assert result["session"] == {
            "landlordDetails": {
                "isLookedUp": True,
                **self.LANDLORD_DETAILS,
            },
            "managementCompanyDetails": None,
        }
        assert onb.user.landlord_details.address == self.LANDLORD_ADDRESS

    @test_landlord_lookup.enable_fake_landlord_lookup
    def test_it_ignores_ll_and_mc_when_use_recommended_is_set(self, requests_mock, nycdb):
        test_landlord_lookup.mock_lookup_success(requests_mock, nycdb)
        self.set_user(OnboardingInfoFactory().user)
        result = self.execute(
            input={
                "useRecommended": True,
                "landlord": [self.MISSING_ZIP_CODE_MAILING_ADDRESS],
                "mgmtCo": [self.MISSING_ZIP_CODE_MAILING_ADDRESS],
            }
        )
        assert result["errors"] == []

    def test_it_ignores_mgmt_co_when_setting_manual_landlord_only(self):
        self.set_user(ManagementCompanyDetailsFactory().user)
        result = self.execute(
            input={
                "useRecommended": False,
                "landlord": [self.LANDLORD_DETAILS],
                "mgmtCo": [self.MISSING_ZIP_CODE_MAILING_ADDRESS],
            }
        )
        assert result["errors"] == []

    def test_it_sets_manual_landlord_only(self):
        mc = ManagementCompanyDetailsFactory()
        self.set_user(mc.user)
        result = self.execute(
            input={
                "useRecommended": False,
                "landlord": [self.LANDLORD_DETAILS],
            }
        )
        assert result["session"] == {
            "landlordDetails": {
                "isLookedUp": False,
                **self.LANDLORD_DETAILS,
            },
            "managementCompanyDetails": self.EMPTY_MAILING_ADDRESS,
        }
        assert mc.user.landlord_details.address == self.LANDLORD_ADDRESS

    def test_it_reports_manual_landlord_errors(self):
        mc = ManagementCompanyDetailsFactory()
        self.set_user(mc.user)
        self.assert_one_field_err(
            "This field is required.",
            field="landlord.0.zipCode",
            input={
                "useRecommended": False,
                "landlord": [self.MISSING_ZIP_CODE_MAILING_ADDRESS],
            },
        )

    def test_it_sets_manual_landlord_and_mgmt_co(self):
        self.set_user(UserFactory())
        result = self.execute(
            input={
                "useRecommended": False,
                "landlord": [self.LANDLORD_DETAILS],
                "useMgmtCo": True,
                "mgmtCo": [self.MGMT_CO_DETAILS],
            }
        )
        assert result["session"] == {
            "landlordDetails": {
                "isLookedUp": False,
                **self.LANDLORD_DETAILS,
            },
            "managementCompanyDetails": self.MGMT_CO_DETAILS,
        }

    def test_it_reports_mgmt_co_errors(self):
        mc = ManagementCompanyDetailsFactory()
        self.set_user(mc.user)
        self.assert_one_field_err(
            "This field is required.",
            field="mgmtCo.0.zipCode",
            input={
                "useRecommended": False,
                "landlord": [self.LANDLORD_DETAILS],
                "useMgmtCo": True,
                "mgmtCo": [self.MISSING_ZIP_CODE_MAILING_ADDRESS],
            },
        )
