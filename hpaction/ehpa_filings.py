from pathlib import Path


MY_DIR = Path(__file__).parent.resolve()
EHPA_FILINGS_SQLFILE = MY_DIR / 'ehpa_filings.sql'


def execute_ehpa_filings_query(cursor):
    cursor.execute(EHPA_FILINGS_SQLFILE.read_text())
