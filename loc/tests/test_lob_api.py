from io import BytesIO
import lob
import pytest

from project.util import lob_api


def test_verify_address_works(mocklob):
    v = lob_api.verify_address(address="blarg")
    assert v["deliverability"] == "deliverable"
    assert lob.api_key == "mypubkey"


def test_mail_certified_letter_works(mocklob):
    f = BytesIO(b"i am a fake pdf")
    ltr = lob_api.mail_certified_letter(
        description="boop", to_address={}, from_address={}, file=f, color=False, double_sided=False
    )
    assert ltr["carrier"] == "USPS"
    assert lob.api_key == "myseckey"


def test_get_deliverability_docs_works(mocklob):
    docs = lob_api.get_deliverability_docs(mocklob.get_sample_verification())
    assert docs == "The address is deliverable by the USPS."


def test_verification_to_inline_address_works(mocklob):
    assert lob_api.verification_to_inline_address(mocklob.get_sample_verification()) == {
        "address_city": "SAN FRANCISCO",
        "address_line1": "185 BERRY ST STE 6100",
        "address_line2": "",
        "address_state": "CA",
        "address_zip": "94107",
    }


def test_get_address_from_verification_works(mocklob):
    assert lob_api.get_address_from_verification(mocklob.get_sample_verification()) == (
        "185 BERRY ST STE 6100\n" "SAN FRANCISCO CA 94107-1728"
    )


class TestIsAddressUndeliverable:
    def test_it_returns_null_if_lob_is_disabled(self):
        assert lob_api.is_address_undeliverable() is None

    def test_it_returns_false_if_addr_is_deliverable(self, mocklob):
        assert lob_api.is_address_undeliverable() is False

    def test_it_returns_true_if_addr_is_undeliverable(self, mocklob):
        mocklob.mock_verifications_api(
            json=mocklob.get_sample_verification(deliverability="undeliverable")
        )
        assert lob_api.is_address_undeliverable() is True

    def test_it_returns_null_if_lob_raises_exception(self, mocklob):
        mocklob.mock_verifications_api(
            json={"error": {"message": "something weird happened"}},
            status_code=500,
        )
        assert lob_api.is_address_undeliverable() is None


@pytest.mark.parametrize(
    "original,expected",
    [
        (
            {
                "name": "superultracalifragilistic ultrapersonofdooooooooooooooooooom",
                "other": "thing",
            },
            {"name": "superultracalifragilistic ultrapersonofd", "other": "thing"},
        ),
        ({"name": "a shorter name"}, {"name": "a shorter name"}),
        ({"hello": "there"}, {"hello": "there"}),
        ({"name": None}, {"name": None}),
    ],
)
def test_truncate_name_in_address_works(original, expected):
    assert lob_api.truncate_name_in_address(original) == expected
