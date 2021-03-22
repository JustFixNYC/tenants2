from pathlib import Path
from django.contrib.auth.hashers import UNUSABLE_PASSWORD_PREFIX

from project.util.site_util import absolute_reverse
from project.admin_download_data import DataDownload
from users.models import CHANGE_USER_PERMISSION


MY_DIR = Path(__file__).parent.resolve()
USER_STATS_SQLFILE = MY_DIR / "userstats.sql"


def execute_user_stats_query(cursor, include_pad_bbl: bool = False):
    from hpaction.models import HP_DOCUSIGN_STATUS_CHOICES

    admin_url_begin, admin_url_end = absolute_reverse(
        "admin:users_justfixuser_change", args=(999,)
    ).split("999")
    cursor.execute(
        USER_STATS_SQLFILE.read_text(),
        {
            "include_pad_bbl": include_pad_bbl,
            "unusable_password_pattern": UNUSABLE_PASSWORD_PREFIX + "%",
            "admin_url_begin": admin_url_begin,
            "admin_url_end": admin_url_end,
            "docusign_signed_status": HP_DOCUSIGN_STATUS_CHOICES.SIGNED,
        },
    )


DATA_DOWNLOADS = [
    DataDownload(
        name="User statistics",
        slug="userstats",
        html_desc="""
            Anonymized statistics about each user,
            including when they completed onboarding, sent a letter of complaint,
            and so on.
            """,
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur, user: execute_user_stats_query(cur, include_pad_bbl=False),
    ),
    DataDownload(
        name="User statistics with BBLs",
        slug="userstats-with-bbls",
        html_desc="""
            This is like the user statistics data but also includes the BBL of each user,
            <strong>which could potentially be used to personally identify them</strong>.
            """,
        perms=[CHANGE_USER_PERMISSION],
        execute_query=lambda cur, user: execute_user_stats_query(cur, include_pad_bbl=True),
    ),
]
