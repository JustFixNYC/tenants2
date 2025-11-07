from typing import Any, Dict


MOCK_DELIVERABLE_ADDRESS_DATA: Dict[str, str] = {
    "primary_line": "deliverable",
    "secondary_line": "Apt 1",
    "city": "BROOKLYN",
    "state": "NY",
    "zip_code": "11111",
}

USER_DATA: Dict[str, str] = {
    **MOCK_DELIVERABLE_ADDRESS_DATA,
    "first_name": "Jane",
    "last_name": "Doe",
    "phone_number": "3475551234",
    "email": "jane@tenant.org",
    "bbl": "1234567890",
}

LANDLORD_DATA: Dict[str, str] = {
    **MOCK_DELIVERABLE_ADDRESS_DATA,
    "name": "John Doe",
    "email": "john@landlord.org",
}

SAMPLE_POST_DATA: Dict[str, Any] = {
    "user_details": USER_DATA,
    "landlord_details": LANDLORD_DATA,
    "mail_choice": "WE_WILL_MAIL",
    "reason": "NON_RENEWAL",
    "good_cause_given": "false",
    "extra_emails": ["one@example.com", "two@example.com"],
    "cc_user": "true",
    "html_content": "<!DOCTYPE html><html>TEST</html>",
}
