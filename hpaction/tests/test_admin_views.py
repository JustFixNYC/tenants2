from django.core.exceptions import ValidationError
import pytest

from project.tests.test_mailing_address import EXAMPLE_KWARGS as ADDRESS_KWARGS
from hpaction.admin_views import (
    ServingPapersForm
)


class TestServingPapersForm:
    # Ok, the PDF file field isn't filled, so this isn't technically
    # correct, but mocking file fields is hard so whatever.
    FILLED_FORM_DATA = {
        'name': 'Landlordo Calrissian',
        **ADDRESS_KWARGS,
        'is_definitely_deliverable': False,
    }

    def test_no_validation_is_done_if_address_is_not_populated(self, mocklob):
        ServingPapersForm.validate_address({'is_definitely_deliverable': False})
        assert mocklob.verifications_mock.called is False

    def test_validation_works_when_addr_is_valid(self, mocklob):
        ServingPapersForm.validate_address(self.FILLED_FORM_DATA)
        assert mocklob.verifications_mock.called is True

    def simulate_undeliverable_addr(self, mocklob):
        mocklob.mock_verifications_api(
            json=mocklob.get_sample_verification(deliverability='undeliverable')
        )

    def test_validation_fails_when_addr_is_invalid(self, mocklob):
        self.simulate_undeliverable_addr(mocklob)
        with pytest.raises(ValidationError, match="address is undeliverable"):
            ServingPapersForm.validate_address(self.FILLED_FORM_DATA)

    def test_validation_succeeds_when_is_definitely_deliverable_is_checked(self, mocklob):
        self.simulate_undeliverable_addr(mocklob)
        ServingPapersForm.validate_address({
            **self.FILLED_FORM_DATA,
            'is_definitely_deliverable': True,
        })
        assert mocklob.verifications_mock.called is False

    def test_clean_works(self, mocklob):
        form = ServingPapersForm(data=self.FILLED_FORM_DATA)
        form.is_valid()
        assert list(form.errors.keys()) == ['pdf_file']
        assert mocklob.verifications_mock.called is True
