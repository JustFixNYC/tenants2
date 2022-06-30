import pytest
import json

from mailchimp.mailchimp import get_email_hash, MailChimpError
from mailchimp.views import is_origin_valid, mailchimp_err_to_json_err
from .test_mailchimp import FAKE_EMAIL_ERR, FAKE_NO_MORE_SIGNUPS_ERR


SUBSCRIBE_PATH = "/mailchimp/subscribe"

VALID_SUBSCRIBE_ARGS = {
    "language": "en",
    "source": "orgsite",
    "email": "boop@jones.com",
}


@pytest.mark.parametrize(
    "origin,valid_origins,result",
    [
        ["https://boop.com", {"*"}, True],
        ["https://boop.com", {"https://boop.com"}, True],
        ["https://boop.com", {}, False],
    ],
)
def test_is_origin_valid(origin, valid_origins, result):
    assert is_origin_valid(origin, valid_origins) is result


@pytest.mark.parametrize(
    "blob,err_code",
    [
        (FAKE_NO_MORE_SIGNUPS_ERR, "NO_MORE_SIGNUPS_FOR_EMAIL"),
        (FAKE_EMAIL_ERR, "INVALID_EMAIL"),
        ({"blah": 1}, "INTERNAL_SERVER_ERROR"),
    ],
)
def test_mailchimp_err_to_json_err(blob, err_code):
    err = mailchimp_err_to_json_err(MailChimpError(blob))
    parsed = json.loads(err.content)
    assert parsed["errorCode"] == err_code


class TestSubscribe:
    def post(self, client, origin="https://www.justfix.nyc", **kwargs):
        return client.post(
            SUBSCRIBE_PATH,
            data={**VALID_SUBSCRIBE_ARGS, **kwargs},
            HTTP_ORIGIN=origin,
        )

    def test_it_returns_404_when_mailchimp_is_disabled(self, client, disable_locale_middleware):
        assert client.post(SUBSCRIBE_PATH).status_code == 404
        assert client.get(SUBSCRIBE_PATH).status_code == 404

    def test_it_returns_docs_on_get(self, client, mailchimp):
        res = client.get(SUBSCRIBE_PATH)
        assert res.status_code == 200
        assert b"Mailchimp subscribe API documentation" in res.content

    def test_post_returns_403_on_invalid_origin(self, client, mailchimp):
        res = self.post(client, origin="https://mysite.com")
        assert res.status_code == 403
        assert res.json() == {
            "status": 403,
            "errorCode": "INVALID_ORIGIN",
        }

    @pytest.mark.parametrize(
        "args,err",
        {
            ((("language", "boop"),), "INVALID_LANGUAGE"),
            ((("source", "boop"),), "INVALID_SOURCE"),
            ((("email", "zzz"),), "INVALID_EMAIL"),
        },
    )
    def test_post_returns_400_on_invalid_args(self, client, mailchimp, args, err):
        res = self.post(client, **dict(args))
        assert res.status_code == 400
        assert res.json() == {
            "status": 400,
            "errorCode": err,
        }

    def test_post_works(self, client, mailchimp, requests_mock):
        md5hash = get_email_hash("boop@jones.com")
        base_url = f"https://us10.api.mailchimp.com/3.0/lists/1234/members/{md5hash}"
        requests_mock.put(base_url, status_code=200, json={})
        requests_mock.post(f"{base_url}/tags", status_code=200, json={})
        res = self.post(client)
        assert res.status_code == 200
        assert res.json() == {
            "status": 200,
        }
