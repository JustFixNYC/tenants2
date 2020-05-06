from django.core.management import call_command
from django.utils.translation import override, gettext_lazy as _

HELLO_WORLD = _("Hello world")


def test_compilemessages_works(settings):
    settings.LANGUAGES = (
        settings.FULLY_SUPPORTED_LANGUAGES +
        settings.PARTIALLY_SUPPORTED_LANGUAGES
    )
    call_command('compilemessages')
    assert str(HELLO_WORLD) == "Hello world"
    with override("es"):
        assert str(HELLO_WORLD) == "Hola mundo"
