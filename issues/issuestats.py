from pathlib import Path

from project.admin_download_data import DataDownload
from users.models import CHANGE_USER_PERMISSION


MY_DIR = Path(__file__).parent.resolve()
ISSUE_STATS_SQLFILE = MY_DIR / "issuestats.sql"


def execute_issue_stats_query(cursor):
    cursor.execute(ISSUE_STATS_SQLFILE.read_text())


DATA_DOWNLOADS = [
    DataDownload(
        name="Issue statistics",
        slug="issuestats",
        html_desc="""Various statistics about the issue checklist.""",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur, user: execute_issue_stats_query(cur),
    ),
]
