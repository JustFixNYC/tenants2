from django.core.management import call_command, CommandError
import pytest


def test_it_works(db, settings):
    settings.AMPLITUDE_API_KEY = "blop"
    call_command("export_to_amplitude")


def test_it_raises_error_when_amplitude_is_disabled():
    with pytest.raises(CommandError, match="AMPLITUDE_API_KEY must be configured"):
        call_command("export_to_amplitude")
