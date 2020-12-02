from django.test import override_settings

from .factories import UploadTokenFactory
from .. import lhiapi


def test_it_returns_none_when_hp_action_is_disabled(db):
    tok = UploadTokenFactory()
    assert lhiapi.get_answers_and_documents(tok, "blah") is None
    tok.refresh_from_db()
    assert tok.errored is True


@override_settings(HP_ACTION_CUSTOMER_KEY="boop")
def test_it_returns_none_when_soap_call_raises_error(fake_soap_call, db):
    tok = UploadTokenFactory()
    fake_soap_call.mock.side_effect = Exception("kaboom")
    assert lhiapi.get_answers_and_documents(tok, "blah") is None
    tok.refresh_from_db()
    assert tok.errored is True
