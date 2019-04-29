from pathlib import Path


MY_DIR = Path(__file__).parent.resolve()
ISSUE_STATS_SQLFILE = MY_DIR / 'issuestats.sql'


def execute_issue_stats_query(cursor):
    cursor.execute(ISSUE_STATS_SQLFILE.read_text())
