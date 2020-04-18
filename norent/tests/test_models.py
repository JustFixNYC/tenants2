from django.core.exceptions import ValidationError
import pytest

from .factories import NationalOnboardingInfoFactory


class TestNationalOnboardingInfo:
    def test_it_works(self, db):
        onb = NationalOnboardingInfoFactory()
        onb.full_clean()

    def test_it_raises_validation_error_on_invalid_state(self, db):
        onb = NationalOnboardingInfoFactory(state='ZZ')
        with pytest.raises(ValidationError):
            onb.full_clean()
