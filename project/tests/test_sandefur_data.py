from django.core.management import call_command


def test_sandefur_user_data(db):
    call_command("exportstats", "sandefur-user-data")


def test_sandefur_issue_data(db):
    call_command("exportstats", "sandefur-issue-data")


def test_sandefur_custom_issue_data(db):
    call_command("exportstats", "sandefur-custom-issue-data")


def test_sandefur_rapidpro_contact_group_data(db):
    call_command("exportstats", "sandefur-rapidpro-contact-group-data")
