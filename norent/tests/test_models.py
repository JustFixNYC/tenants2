from django.core.exceptions import ValidationError
import pytest

from .factories import NationalOnboardingInfoFactory


class TestNationalOnboardingInfo:
    def test_it_works(self, db):
        onb = NationalOnboardingInfoFactory()
        onb.full_clean()

    @pytest.mark.parametrize('kwargs', [
        dict(state='ZZ'),
        dict(zip_code='abcde'),
    ])
    def test_it_raises_validation_errors(self, db, kwargs):
        onb = NationalOnboardingInfoFactory(**kwargs)
        with pytest.raises(ValidationError):
            onb.full_clean()
