from typing import Union, Optional
import urllib.parse

import docusign_esign as dse
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from django.conf import settings

from project.util.site_util import absolute_reverse
from users.models import JustfixUser
from .models import Config


# Number of seconds our JWT lasts.
JWT_EXPIRATION = 3600

# Settings that are required for DocuSign integration to work properly.
REQUIRED_SETTINGS = [
    "DOCUSIGN_ACCOUNT_ID",
    "DOCUSIGN_INTEGRATION_KEY",
    "DOCUSIGN_USER_ID",
    "DOCUSIGN_AUTH_SERVER_DOMAIN",
]


def get_account_base_uri(token: Union[str, dse.OAuthToken]) -> Optional[str]:
    """
    Validate that the given OAuth token has access to the DocuSign
    account we need, and return the account's base URI.

    If the token doesn't have access to our DocuSign account, return None.
    """

    api_client = create_api_client(get_auth_server_url(), token)

    # https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints
    response = api_client.call_api("/oauth/userinfo", "GET", response_type="object")
    if len(response) > 1 and 200 > response[1] > 300:
        raise Exception(f"Received HTTP {response[1]}")
    accounts = [
        acct
        for acct in response[0]["accounts"]
        if acct["account_id"] == settings.DOCUSIGN_ACCOUNT_ID
    ]
    if not accounts:
        return None
    return accounts[0]["base_uri"]


def validate_and_set_consent_code(code: str) -> bool:
    """
    Validate that the given consent code has the access permissions we need,
    and set it as the current consent code for all our e-signing requests
    with DocuSign.

    Returns False if the consent code doesn't have the correct permissions.
    """

    token = request_jwt_user_token(code)

    base_uri = get_account_base_uri(token)
    if not base_uri:
        return False

    cfg = get_config()
    cfg.consent_code = code
    cfg.consent_code_updated_at = timezone.now()
    cfg.base_uri = base_uri
    cfg.save()
    return True


def is_enabled() -> bool:
    """
    Returns whether DocuSign integration is enabled.
    """

    return bool(settings.DOCUSIGN_ACCOUNT_ID)


def ensure_valid_configuration():
    """
    Ensures that the DocuSign settings are properly defined. It doesn't actually
    verify that *DocuSign* thinks they're valid, though.
    """

    for setting in REQUIRED_SETTINGS:
        if not getattr(settings, setting):
            raise ImproperlyConfigured(f"The {setting} setting is not configured!")

    config = get_config()

    if not config.private_key:
        raise ImproperlyConfigured(
            "DocuSign private key is not configured! Please run the 'manage.py setdocusignkey' "
            "command."
        )

    if not (config.consent_code and config.base_uri):
        cburl = absolute_reverse("docusign:callback")
        conurl = absolute_reverse("docusign:consent")
        raise ImproperlyConfigured(
            f"DocuSign consent code is not configured!  "
            f"Please make sure you have registered {cburl} as a "
            f"callback URL in DocuSign and then "
            f"obtain consent from a DocuSign user at {conurl}."
        )


def get_config() -> Config:
    """
    Return the singleton DocuSign configuration from the database.
    """

    return Config.objects.get()


def get_auth_server_domain() -> str:
    """
    Returns the domain name for the DocuSign authentication server.
    """

    return settings.DOCUSIGN_AUTH_SERVER_DOMAIN


def get_auth_server_url() -> str:
    return f"https://{get_auth_server_domain()}"


def get_private_key_bytes() -> bytes:
    return get_config().private_key.encode("ascii")


def docusign_client_user_id(user: JustfixUser) -> str:
    """
    Given a user, return the DocuSign client user ID representing it.

    According to the DocuSign documentation, the client user ID is:

    > An alphanumeric value that serves as an ID for the signer throughout
    > the signing process. The combination of this value, the signer's name,
    > and the signer's email is used to uniquely identify them.

    For more details, see:

    https://developers.docusign.com/esign-rest-api/code-examples/quickstart-request-signature-embedded
    """

    return str(user.pk)


def create_api_client(
    host: str, access_token: Union[None, str, dse.OAuthToken] = None
) -> dse.ApiClient:
    api_client = dse.ApiClient()
    api_client.host = host
    if isinstance(access_token, dse.OAuthToken):
        access_token = access_token.access_token
    if access_token:
        api_client.set_default_header("Authorization", f"Bearer {access_token}")
    return api_client


def create_default_api_client() -> dse.ApiClient:
    """
    Creates a DocuSign API client using the currently-configured settings.

    This requests a JSON Web Token in the process, so it won't return
    instantaneously.
    """

    config = get_config()
    token = request_jwt_user_token(config.consent_code)
    return create_api_client(f"{config.base_uri}/restapi", token)


def create_oauth_consent_url(
    return_url: str,
    state: str = "",
) -> str:
    """
    Returns a URL to redirect the user to, which will start the
    DocuSign OAuth consent flow.
    """

    qs = urllib.parse.urlencode(
        {
            "response_type": "code",
            "scope": "signature impersonation",
            "client_id": settings.DOCUSIGN_INTEGRATION_KEY,
            "state": state,
            "redirect_uri": return_url,
        }
    )
    return f"{get_auth_server_url()}/oauth/auth?{qs}"


def request_jwt_user_token(code: str) -> dse.OAuthToken:
    """
    Request a DocuSign JSON Web Token for the given user's consent code,
    and return it.

    Note tha this JWT will only last a short time (at the time of
    this writing, it's 5 minutes). It's the consent code that's
    long-lived, not the JWT.
    """

    api_client = create_api_client(get_auth_server_url())
    token = api_client.request_jwt_user_token(
        client_id=settings.DOCUSIGN_INTEGRATION_KEY,
        user_id=settings.DOCUSIGN_USER_ID,
        oauth_host_name=get_auth_server_domain(),
        private_key_bytes=get_private_key_bytes(),
        expires_in=JWT_EXPIRATION,
    )
    assert isinstance(token, dse.OAuthToken)
    return token
