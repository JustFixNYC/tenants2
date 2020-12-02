from io import StringIO
from django.core.management import call_command


def test_all_files_have_unix_line_endings():
    out = StringIO()
    err = StringIO()
    call_command("fixnewlines", "--dry-run", stdout=out, stderr=err)

    # Ensure no warnings are logged to stderr.
    assert err.getvalue() == ""

    assert out.getvalue() == "Yay, all files have Unix-style line endings!\n"
