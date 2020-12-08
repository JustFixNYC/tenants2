from pathlib import Path

from project.admin_download_data import DataDownload
from users.models import CHANGE_USER_PERMISSION


MY_DIR = Path(__file__).parent.resolve()
EHPA_FILINGS_SQLFILE = MY_DIR / 'ehpa_filings.sql'


def execute_ehpa_filings_query(cursor):
    cursor.execute(EHPA_FILINGS_SQLFILE.read_text())


DATA_DOWNLOADS = [
    DataDownload(
        name='EHPA filings',
        slug='ehpa-filings',
        html_desc="""
            Details about tenants who have filed Emergency HP Actions.  Intended
            primarily for handing off to NYC HRA/OCJ.  This contains PII, so
            please be careful with it.  <strong>Note:</strong> most of the
            fields here represent <em>current</em> user data rather than
            data as it existed when the user filed the EHPA.
            """,
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur, user: execute_ehpa_filings_query(cur),
    ),
]
