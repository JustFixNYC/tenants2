from django.core.management import call_command


def test_system_checks():
    """
    Strangely enough, errors raised by 'manage.py runserver', such as
    ensuring that ModelAdmin subclasses don't have typos in them,
    aren't caught by the test suite unless we explicitly invoke Django's
    system check framework.

    This invokes said framework to make sure our Django configuration
    is copacetic.
    """

    call_command("check", "--fail-level", "WARNING")
