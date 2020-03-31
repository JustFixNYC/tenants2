from decimal import Decimal
from django.test import override_settings
import pytest

from users.tests.factories import UserFactory
from issues.models import Issue, ISSUE_CHOICES, ISSUE_AREA_CHOICES
from .factories import (
    UploadTokenFactory, FeeWaiverDetailsFactory, TenantChildFactory,
    HPActionDocumentsFactory)
from hpaction.models import (
    get_upload_status_for_user, HPUploadStatus, TenantChild, HPActionDetails)
from hpaction.schema import sync_emergency_issues
import hpaction.docusign


def execute_tenant_children_mutation(graphql_client, children):
    return graphql_client.execute(
        """
        mutation MyMutation($input: TenantChildrenInput!) {
            output: tenantChildren(input: $input) {
                errors { field, messages }
            }
        }
        """,
        variables={'input': {
            'children': children
        }}
    )['data']['output']


def test_tenant_children_mutation_requires_login(db, graphql_client):
    result = execute_tenant_children_mutation(graphql_client, [])
    assert result['errors'] == [{'field': '__all__', 'messages': [
        'You do not have permission to use this form!'
    ]}]


class TestEmergencyHPAIssuesMutation:
    def test_sync_emergency_issues_works(self, db):
        HOME = ISSUE_AREA_CHOICES.HOME
        MICE = ISSUE_CHOICES.HOME__MICE
        NO_HEAT = ISSUE_CHOICES.HOME__NO_HEAT
        NO_GAS = ISSUE_CHOICES.HOME__NO_GAS

        user = UserFactory()
        Issue.objects.set_area_issues_for_user(user, HOME, [MICE])

        def gethomeissues():
            return set(Issue.objects.get_area_issues_for_user(user, HOME))

        sync_emergency_issues(user, [NO_HEAT])
        assert gethomeissues() == {NO_HEAT, MICE}
        sync_emergency_issues(user, [NO_GAS])
        assert gethomeissues() == {NO_GAS, MICE}

    def test_it_works(self, graphql_client, db):
        user = UserFactory()
        graphql_client.request.user = user
        result = graphql_client.execute(
            '''
            mutation {
                output: emergencyHpaIssues(input: {issues: ["HOME__NO_HEAT"]}) {
                    session { issues }
                }
            }
            '''
        )
        assert result['data']['output']['session']['issues'] == ['HOME__NO_HEAT']
        details = HPActionDetails.objects.get(user=user)
        assert details.sue_for_repairs is True
        assert details.sue_for_harassment is False


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
        )['data']['session']['tenantChildren']

    def test_it_returns_none_if_not_logged_in(self, graphql_client):
        assert self.query(graphql_client) is None

    def test_it_returns_list_if_logged_in(self, db, graphql_client):
        child = TenantChildFactory()
        graphql_client.request.user = child.user
        results = self.query(graphql_client)
        assert len(results) == 1
        r = results[0]
        assert r['id'] == str(child.id)
        assert r['name'] == child.name
        assert r['dob'] == '2001-10-11'


class TestTenantChildrenMutation:
    BLANK_INPUT = {
        'name': '',
        'dob': '',
        'DELETE': False
    }

    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client):
        user = UserFactory.create()
        graphql_client.request.user = user
        self.graphql_client = graphql_client

    def mutate(self, children, ensure_success=False):
        result = execute_tenant_children_mutation(self.graphql_client, children)
        if ensure_success:
            assert result['errors'] == []
        return result

    def get_children(self):
        return list(TenantChild.objects.all())

    def test_submitting_empty_list_does_nothing(self):
        self.mutate([], ensure_success=True)
        assert len(self.get_children()) == 0

    def test_adding_and_removing_child_works(self):
        # Ensure adding a child works.
        self.mutate([{
            **self.BLANK_INPUT,
            'name': 'Boop Jones Jr.',
            'dob': '10/12/2001',
        }], ensure_success=True)
        children = self.get_children()
        assert len(children) == 1

        # Ensure submitting a blank form does nothing.
        self.mutate([], ensure_success=True)
        assert len(self.get_children()) == 1

        # Ensure deleting the child works.
        self.mutate([{
            **self.BLANK_INPUT,
            'id': str(children[0].id),
            'DELETE': True
        }], ensure_success=True)
        assert len(self.get_children()) == 0

    def test_submitting_blank_form_does_nothing(self):
        self.mutate([self.BLANK_INPUT], ensure_success=True)
        assert len(self.get_children()) == 0

    def test_submitting_incomplete_form_reports_errors(self):
        result = self.mutate([{
            **self.BLANK_INPUT,
            'name': 'Blarf',
        }])
        assert len(result['errors']) > 0
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
        variables={'input': input}
    )['data']['output']


class TestGenerateHPActionPDF:
    def test_it_requires_auth(self, graphql_client):
        result = execute_genpdf_mutation(graphql_client)
        assert result['errors'] == [{'field': '__all__', 'messages': [
            'You do not have permission to use this form!'
        ]}]

    @pytest.mark.django_db
    def test_it_errors_if_hpaction_is_disabled(self, graphql_client):
        user = UserFactory.create()
        graphql_client.request.user = user
        result = execute_genpdf_mutation(graphql_client)
        assert result['errors'] == []
        assert get_upload_status_for_user(user) == HPUploadStatus.ERRORED

    @pytest.mark.django_db
    @override_settings(HP_ACTION_CUSTOMER_KEY="boop")
    def test_it_works(self, graphql_client, fake_soap_call, django_file_storage):
        user = UserFactory.create()
        graphql_client.request.user = user
        fake_soap_call.simulate_success(user)
        result = execute_genpdf_mutation(graphql_client)
        assert result['errors'] == []
        assert get_upload_status_for_user(user) == HPUploadStatus.SUCCEEDED


class TestSessionPdfInfo:
    def execute(self, graphql_client):
        return graphql_client.execute(
            'query { session { latestHpActionPdfUrl, hpActionUploadStatus } }'
        )['data']['session']

    def test_it_works_if_unauthenticated(self, graphql_client):
        assert self.execute(graphql_client) == {
            'latestHpActionPdfUrl': None,
            'hpActionUploadStatus': 'NOT_STARTED'
        }

    @pytest.mark.django_db
    def test_it_works_if_logged_in_but_not_started(self, graphql_client):
        graphql_client.request.user = UserFactory.create()
        assert self.execute(graphql_client) == {
            'latestHpActionPdfUrl': None,
            'hpActionUploadStatus': 'NOT_STARTED'
        }

    @pytest.mark.django_db
    def test_it_works_if_started(self, graphql_client):
        tok = UploadTokenFactory()
        graphql_client.request.user = tok.user
        assert self.execute(graphql_client) == {
            'latestHpActionPdfUrl': None,
            'hpActionUploadStatus': 'STARTED'
        }


class TestSessionFeeWaiverInfo:
    def execute(self, graphql_client):
        return graphql_client.execute(
            'query { session { feeWaiver { incomeAmountMonthly } } }'
        )['data']['session']

    def test_it_works_if_unauthenticated(self, graphql_client):
        assert self.execute(graphql_client) == {
            'feeWaiver': None,
        }

    def test_it_works_if_started(self, graphql_client, db):
        fw = FeeWaiverDetailsFactory(income_amount_monthly=Decimal('3.15'))
        graphql_client.request.user = fw.user
        assert self.execute(graphql_client) == {
            'feeWaiver': {
                'incomeAmountMonthly': 3.15
            }
        }


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
    result = graphql_client.execute(EMAIL_PACKET_GRAPHQL)['data']['emailHpActionPdf']
    assert result == {'errors': [], 'recipients': ['boop@jones.com']}
    assert len(mailoutbox) == 1


def test_email_packet_errors_if_no_packet_exists(db, graphql_client):
    graphql_client.request.user = UserFactory()
    result = graphql_client.execute(EMAIL_PACKET_GRAPHQL)['data']['emailHpActionPdf']
    assert result['errors'][0]['messages'] == ['You do not have an HP Action packet to send!']


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
        self.user = UserFactory(email='boop@jones.com', is_email_verified=True)
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client
        monkeypatch.setattr(
            hpaction.docusign,
            'create_envelope_and_recipient_view_for_hpa',
            self._fake_create_env_and_view
        )

    def execute(self):
        return self.graphql_client.execute(self.GRAPHQL)['data']['beginDocusign']

    def _fake_create_env_and_view(self, user, envelope_definition, api_client, return_url):
        assert return_url.startswith('https://example.com/docusign/callback?')
        assert user.pk == self.user.pk
        return ('fake envelope defn', f'https://fake-docusign')

    def ensure_error(self, message):
        assert self.execute()['errors'] == [{'field': '__all__', 'messages': [message]}]

    def test_it_raises_error_on_no_email(self):
        self.user.email = ''
        self.user.save()
        self.ensure_error('You have no email address!')

    def test_it_raises_error_on_unverified_email(self):
        self.user.is_email_verified = False
        self.user.save()
        self.ensure_error('Your email address is not verified!')

    def test_it_raises_error_on_no_docs(self):
        self.ensure_error('You have no HP Action documents to sign!')

    def test_it_works(self, mockdocusign, django_file_storage):
        HPActionDocumentsFactory(user=self.user)
        result = self.execute()
        assert result == {'errors': [], 'redirectUrl': 'https://fake-docusign'}
