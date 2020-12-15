from io import StringIO
from pathlib import Path
from dataclasses import dataclass
from django.core.management import call_command

CSV_FILE = Path(__file__).parent.resolve() / "test_loadnycha.csv"


@dataclass
class LoadNychaCommandResult:
    stdout: str
    stderr: str


def load_nycha_csv_data():
    out = StringIO()
    err = StringIO()
    call_command("loadnycha", str(CSV_FILE), stdout=out, stderr=err)
    return LoadNychaCommandResult(stdout=out.getvalue(), stderr=err.getvalue())
