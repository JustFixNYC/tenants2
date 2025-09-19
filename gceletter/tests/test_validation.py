import pytest
from gceletter.tests.sample_data import MOCK_DELIVERABLE_ADDRESS_DATA, LANDLORD_DATA, USER_DATA
from gceletter.util import (
    DataValidationError,
    LOBAddressData,
    LandlordDetailsData,
    UserDetailsData,
    validate_data,
)


class TestLOBAddressValidation:
    def test_valid_lob_address_works(self):
        LOBAddressData(**MOCK_DELIVERABLE_ADDRESS_DATA)

    def test_missing_required_field_fails(self):
        test_data = MOCK_DELIVERABLE_ADDRESS_DATA
        del test_data["primary_line"]
        with pytest.raises(DataValidationError, match="field required"):
            validate_data(test_data, LOBAddressData)

    def test_invalid_zipcode_fails(self):
        with pytest.raises(DataValidationError, match="Zip Code must be valid"):
            validate_data({**MOCK_DELIVERABLE_ADDRESS_DATA, "zip_code": "abc"}, LOBAddressData)

    def test_missing_urbanization_for_pr_fails(self):
        with pytest.raises(DataValidationError, match="Urbanization field is required"):
            validate_data({**MOCK_DELIVERABLE_ADDRESS_DATA, "state": "PR"}, LOBAddressData)


class TestUserDetailsValidation:
    def test_valid_user_works(self):
        validate_data(USER_DATA, UserDetailsData)

    def test_invalid_bbl_fails(self):
        with pytest.raises(DataValidationError, match="BBL must be 10-digit zero padded string"):
            validate_data({**USER_DATA, "bbl": "0123"}, UserDetailsData)


class TestLandlordDetailsValidation:
    def test_valid_landlord_works(self):
        validate_data(LANDLORD_DATA, LandlordDetailsData)

    def test_missing_name_fails(self):
        test_data = {k: v for k, v in LANDLORD_DATA.items() if k != "name"}
        with pytest.raises(DataValidationError, match="field required"):
            validate_data(test_data, LandlordDetailsData)
