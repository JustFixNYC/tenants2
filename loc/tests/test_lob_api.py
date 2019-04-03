import json
from pathlib import Path
from io import BytesIO
import lob

from loc import lob_api

LOB_LETTERS_URL = 'https://api.lob.com/v1/letters'

LOB_VERIFICATIONS_URL = 'https://api.lob.com/v1/us_verifications'

MY_DIR = Path(__file__).parent.resolve()

LETTER_JSON = MY_DIR / 'lob_letter.json'

VERIFICATION_JSON = MY_DIR / 'lob_verification.json'


def get_sample_letter():
    return json.loads(LETTER_JSON.read_text())


def get_sample_verification():
    return json.loads(VERIFICATION_JSON.read_text())


def test_verify_address_works(requests_mock, settings):
    settings.LOB_PUBLISHABLE_API_KEY = 'mypubkey'
    requests_mock.post(
        LOB_VERIFICATIONS_URL,
        json=get_sample_verification()
    )
    v = lob_api.verify_address(address='blarg')
    assert v['deliverability'] == 'deliverable'
    assert lob.api_key == 'mypubkey'


def test_mail_certified_letter_works(requests_mock, settings):
    settings.LOB_SECRET_API_KEY = 'myseckey'
    requests_mock.post(
        LOB_LETTERS_URL,
        json=get_sample_letter()
    )
    f = BytesIO(b"i am a fake pdf")
    ltr = lob_api.mail_certified_letter(
        description='boop',
        to_address={},
        from_address={},
        file=f,
        color=False,
    )
    assert ltr['carrier'] == 'USPS'
    assert lob.api_key == 'myseckey'


def test_get_deliverability_docs_works():
    docs = lob_api.get_deliverability_docs(get_sample_verification())
    assert docs == 'The address is deliverable by the USPS.'


def test_verification_to_inline_address_works():
    assert lob_api.verification_to_inline_address(get_sample_verification()) == {
        'address_city': 'SAN FRANCISCO',
        'address_line1': '185 BERRY ST STE 6100',
        'address_line2': '',
        'address_state': 'CA',
        'address_zip': '94107'
    }


def test_get_address_from_verification_works():
    assert lob_api.get_address_from_verification(get_sample_verification()) == (
        '185 BERRY ST STE 6100\n'
        'SAN FRANCISCO CA 94107-1728'
    )
