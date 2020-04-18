from .factories import NationalOnboardingInfoFactory


class TestNationalOnboardingInfo:
    def test_it_works(self, db):
        onb = NationalOnboardingInfoFactory()
        onb.full_clean()
