from pathlib import Path
from io import StringIO
import pytest
from django.core.management import call_command, CommandError

from users.tests.factories import UserFactory

TEST_EXTRACT_BASENAME = "test-hp-action"
EXTRACT_BASENAME_ARGS = ["--extract-basename", TEST_EXTRACT_BASENAME]
extract_xml_path = Path(f"{TEST_EXTRACT_BASENAME}.xml")
extract_pdf_path = Path(f"{TEST_EXTRACT_BASENAME}.pdf")
extract_paths = [extract_xml_path, extract_pdf_path]


def setup():
    for path in extract_paths:
        if path.exists():
            path.unlink()


def test_it_raises_error_if_customer_key_is_undefined():
    with pytest.raises(CommandError, match="HP_ACTION_CUSTOMER_KEY is not defined"):
        call_command("hpsend", "blarg")


def test_it_raises_error_on_invalid_kind():
    with pytest.raises(CommandError, match="Invalid kind"):
        call_command("hpsend", "blarg", "--kind=FLARG")


def test_it_works(db, settings, fake_soap_call, django_file_storage):
    settings.HP_ACTION_CUSTOMER_KEY = "blarg"
    out = StringIO()
    user = UserFactory()
    fake_soap_call.simulate_success(user)
    call_command("hpsend", user.username, *EXTRACT_BASENAME_ARGS, stdout=out)
    assert "Successfully received HP Action documents" in out.getvalue()
    assert not extract_xml_path.exists()
    assert not extract_pdf_path.exists()


def test_it_extracts_files(db, settings, fake_soap_call, django_file_storage):
    settings.HP_ACTION_CUSTOMER_KEY = "blarg"
    out = StringIO()
    user = UserFactory()
    fake_soap_call.simulate_success(user)
    call_command("hpsend", user.username, "--extract-files", *EXTRACT_BASENAME_ARGS, stdout=out)
    assert "Successfully received HP Action documents" in out.getvalue()
    assert "Writing test-hp-action.xml." in out.getvalue()
    assert 'name="Sue for harassment TF"' in extract_xml_path.read_text()
    assert len(extract_pdf_path.read_bytes()) > 0


def test_it_can_send_an_explicit_file_as_input(db, settings, fake_soap_call, django_file_storage):
    settings.HP_ACTION_CUSTOMER_KEY = "blarg"
    out = StringIO()
    user = UserFactory()
    fake_soap_call.simulate_success(user)
    call_command(
        "hpsend", user.username, "--xml-input-file", __file__, *EXTRACT_BASENAME_ARGS, stdout=out
    )
    assert ".py as input for document assembly" in out.getvalue()


def test_it_raises_error_on_unexpected_soap_result(db, settings, fake_soap_call):
    settings.HP_ACTION_CUSTOMER_KEY = "blarg"
    fake_soap_call.mock.return_value = "oops uhoh"
    with pytest.raises(CommandError, match="An error occurred when generating"):
        call_command("hpsend", UserFactory().username)
