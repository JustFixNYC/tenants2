from typing import Tuple, Union
import urllib.parse
import base64
import docusign_esign as docusign
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from django.conf import settings

from project.util.site_util import absolute_reverse
from users.models import JustfixUser
from .models import HPActionDocuments, DocusignConfig

# The recipient ID for the tenant in the signing flow. This appears to be a
# number local to a specific signing, rather than a globally unique identifier.
TENANT_RECIPIENT_ID = '1'

# The document ID for the HP Action packet in the signing flow. This appears
# to be a number local to a specific signing, rather than a globally unique
# identifier.
HPA_DOCUMENT_ID = '1'

# Number of seconds our JWT lasts.
JWT_EXPIRATION = 3600

# Settings that are required for DocuSign integration to work properly.
REQUIRED_SETTINGS = [
    'DOCUSIGN_ACCOUNT_ID',
    'DOCUSIGN_INTEGRATION_KEY',
    'DOCUSIGN_USER_ID',
]


def validate_and_set_consent_code(code: str) -> bool:
    token = request_jwt_user_token(code)
    api_client = create_api_client(get_auth_server_url(), token)

    # https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints
    response = api_client.call_api("/oauth/userinfo", "GET", response_type="object")
    if len(response) > 1 and 200 > response[1] > 300:
        raise Exception(f"Received HTTP {response[1]}")
    accounts = [
        acct for acct in response[0]['accounts']
        if acct['account_id'] == settings.DOCUSIGN_ACCOUNT_ID
    ]
    if not accounts:
        return False

    account = accounts[0]
    cfg = DocusignConfig.objects.get()
    cfg.consent_code = code
    cfg.consent_code_updated_at = timezone.now()
    cfg.base_uri = account['base_uri']
    cfg.save()
    return True


def ensure_valid_configuration():
    for setting in REQUIRED_SETTINGS:
        if not getattr(settings, setting):
            raise ImproperlyConfigured(f"The {setting} setting is not configured!")

    config = DocusignConfig.objects.get()

    if not config.private_key:
        raise ImproperlyConfigured(
            "DocuSign private key is not configured! Please run the 'manage.py setdocusignkey' "
            "command."
        )

    url = absolute_reverse('hpaction:docusign_consent')
    if not (config.consent_code and config.base_uri):
        raise ImproperlyConfigured(f"Please obtain consent from a DocuSign user at {url}.")


def get_api_base_path() -> str:
    '''
    Returns the base path for the DocuSign REST API.
    '''

    return DocusignConfig.objects.get().base_uri


def get_auth_server_domain() -> str:
    '''
    Returns the domain name for the DocuSign authentication server.
    '''

    # TODO: We should return the production one if needed.
    return 'account-d.docusign.com'


def get_auth_server_url() -> str:
    return f'https://{get_auth_server_domain()}'


def get_private_key_bytes() -> bytes:
    return DocusignConfig.objects.get().private_key.encode('ascii')


def docusign_client_user_id(user: JustfixUser) -> str:
    '''
    Given a user, return the DocuSign client user ID representing it.

    According to the DocuSign documentation, the client user ID is:

    > An alphanumeric value that serves as an ID for the signer throughout
    > the signing process. The combination of this value, the signer's name,
    > and the signer's email is used to uniquely identify them.

    For more details, see:

    https://developers.docusign.com/esign-rest-api/code-examples/quickstart-request-signature-embedded
    '''

    return str(user.pk)


def create_envelope_definition_for_hpa(docs: HPActionDocuments) -> docusign.EnvelopeDefinition:
    '''
    Create a DocuSign envelope definition for the given HP Action documents.
    '''

    user = docs.user
    pdf_bytes = docs.pdf_file.open().read()
    base64_pdf = base64.b64encode(pdf_bytes).decode('ascii')

    document = docusign.Document(
        document_base64=base64_pdf,
        name=f"HP Action forms for {user.full_name}",
        file_extension="pdf",
        document_id=HPA_DOCUMENT_ID,
    )

    signer = docusign.Signer(
        email=user.email,
        name=user.full_name,
        recipient_id=TENANT_RECIPIENT_ID,
        routing_order="1",
        client_user_id=docusign_client_user_id(user),
    )

    sign_here_petition = docusign.SignHere(
        document_id=HPA_DOCUMENT_ID,
        page_number='4',
        recipient_id=TENANT_RECIPIENT_ID,
        tab_label='SignHereTab',
        x_position='419',
        y_position='556',
    )

    sign_here_verification = docusign.SignHere(
        document_id=HPA_DOCUMENT_ID,
        page_number='4',
        recipient_id=TENANT_RECIPIENT_ID,
        tab_label='SignHereTab',
        x_position='419',
        y_position='667',
    )

    sign_here_hpd_inspection = docusign.SignHere(
        document_id=HPA_DOCUMENT_ID,
        page_number='5',
        recipient_id=TENANT_RECIPIENT_ID,
        tab_label='SignHereTab',
        x_position='446',
        y_position='625',
    )

    signer.tabs = docusign.Tabs(
        sign_here_tabs=[
            sign_here_petition,
            sign_here_verification,
            sign_here_hpd_inspection
        ],
    )

    envelope_definition = docusign.EnvelopeDefinition(
        email_subject=f"{user.full_name}, please sign these HP Action forms",
        documents=[document],
        recipients=docusign.Recipients(signers=[signer]),
        status="sent",
    )

    assert isinstance(envelope_definition, docusign.EnvelopeDefinition)

    return envelope_definition


def create_api_client(
    host: str,
    access_token: Union[None, str, docusign.OAuthToken] = None
) -> docusign.ApiClient:
    api_client = docusign.ApiClient()
    api_client.host = host
    if isinstance(access_token, docusign.OAuthToken):
        access_token = access_token.access_token
    if access_token:
        api_client.set_default_header('Authorization', f'Bearer {access_token}')
    return api_client


def create_default_api_client() -> docusign.ApiClient:
    config = DocusignConfig.objects.get()
    token = request_jwt_user_token(config.consent_code)
    return create_api_client(f"{config.base_uri}/restapi", token)


def create_envelope_and_recipient_view_for_hpa(
    user: JustfixUser,
    envelope_definition: docusign.EnvelopeDefinition,
    api_client: docusign.ApiClient,
    return_url: str,
) -> Tuple[docusign.EnvelopeSummary, str]:
    '''
    Create a DocuSign envelope and recipient view request for
    HP Action documents represented by a given envelope definition.
    '''

    envelope_api = docusign.EnvelopesApi(api_client)
    envelope = envelope_api.create_envelope(
        settings.DOCUSIGN_ACCOUNT_ID,
        envelope_definition=envelope_definition
    )

    assert isinstance(envelope, docusign.EnvelopeSummary)

    envelope_id = envelope.envelope_id
    recipient_view_request = docusign.RecipientViewRequest(
        authentication_method='None',  # TODO: This should probably change?
        client_user_id=docusign_client_user_id(user),
        recipient_id=TENANT_RECIPIENT_ID,
        return_url=return_url,
        user_name=user.full_name,
        email=user.email,
    )

    results = envelope_api.create_recipient_view(
        settings.DOCUSIGN_ACCOUNT_ID,
        envelope_id,
        recipient_view_request=recipient_view_request,
    )

    return (envelope, results.url)


def create_oauth_consent_url(
    return_url: str,
    state: str = '',
) -> str:
    qs = urllib.parse.urlencode({
        'response_type': 'code',
        'scope': 'signature impersonation',
        'client_id': settings.DOCUSIGN_INTEGRATION_KEY,
        'state': state,
        'redirect_uri': return_url,
    })
    return f'{get_auth_server_url()}/oauth/auth?{qs}'


def request_jwt_user_token(code: str) -> docusign.OAuthToken:
    api_client = create_api_client(get_auth_server_url())
    token = api_client.request_jwt_user_token(
        client_id=settings.DOCUSIGN_INTEGRATION_KEY,
        user_id=settings.DOCUSIGN_USER_ID,
        oauth_host_name=get_auth_server_domain(),
        private_key_bytes=get_private_key_bytes(),
        expires_in=JWT_EXPIRATION,
    )
    assert isinstance(token, docusign.OAuthToken)
    return token
