ADDRESS_DATA = {
    "primary_line": "deliverable",
    "secondary_line": "Apt 1",
    "city": "BROOKLYN",
    "state": "NY",
    "zip_code": "11111",
}

USER_DATA = {
    **ADDRESS_DATA,
    "first_name": "Jane",
    "last_name": "Doe",
    "phone_number": "3475551234",
    "email": "jane@tenant.org",
    "bbl": "1234567890",
}

LANDLORD_DATA = {
    **ADDRESS_DATA,
    "name": "John Doe",
    "email": "john@landlord.org",
}

SAMPLE_POST_DATA = {
    "user_details": USER_DATA,
    "landlord_details": LANDLORD_DATA,
    "mail_choice": "WE_WILL_MAIL",
    "email_to_landlord": True,
    "html_content": "<!DOCTYPE html><html>TEST</html>",
}
