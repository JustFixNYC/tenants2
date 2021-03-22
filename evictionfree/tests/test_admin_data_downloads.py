from django.core.management import call_command


def test_evictionfree_hj4a_users(db):
    call_command("exportstats", "evictionfree-hj4a-users")


def test_evictionfree_rtc_users(db):
    call_command("exportstats", "evictionfree-rtc-users")
