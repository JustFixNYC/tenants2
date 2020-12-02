from typing import Dict
import docusign_esign as dse

from docusign import core


def simpleuuid(hexbyte: str) -> str:
    uuid = "-".join([hexbyte * 4, hexbyte * 2, hexbyte * 2, hexbyte * 2, hexbyte * 6])
    assert len(uuid) == 36
    return uuid


class FakeApiClient:
    def __init__(self):
        self.default_headers: Dict[str, str] = {}

    def set_default_header(self, header, value):
        self.default_headers[header] = value

    def request_jwt_user_token(self, **kwargs):
        return dse.OAuthToken(access_token="faketoken")

    def call_api(self, path, method, response_type):
        from django.conf import settings

        return (
            {
                "accounts": [
                    {
                        "account_id": settings.DOCUSIGN_ACCOUNT_ID,
                        "base_uri": "https://fake-docusign",
                    }
                ]
            },
            200,
        )


def mockdocusign(db, settings, monkeypatch):
    settings.DOCUSIGN_ACCOUNT_ID = simpleuuid("aa")
    settings.DOCUSIGN_INTEGRATION_KEY = simpleuuid("bb")
    settings.DOCUSIGN_USER_ID = simpleuuid("cc")
    cfg = core.get_config()
    cfg.private_key = "fake_private_key"
    cfg.consent_code = "fake_consent_code"
    cfg.base_uri = "https://fake-docusign"
    cfg.save()
    monkeypatch.setattr(dse, "ApiClient", FakeApiClient)
    yield cfg
