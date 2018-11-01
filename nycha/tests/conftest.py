from io import StringIO
from pathlib import Path
from dataclasses import dataclass
import pytest
from django.core.management import call_command

CSV_FILE = Path(__file__).parent.resolve() / 'test_loadnycha.csv'


@dataclass
class LoadNychaCommandResult:
    stdout: str
    stderr: str


@pytest.fixture(scope="package")
def loaded_nycha_csv_data(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        out = StringIO()
        err = StringIO()
        call_command('loadnycha', str(CSV_FILE), stdout=out, stderr=err)
        yield LoadNychaCommandResult(
            stdout=out.getvalue(), stderr=err.getvalue())
