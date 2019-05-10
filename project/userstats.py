from pathlib import Path
from django.contrib.auth.hashers import UNUSABLE_PASSWORD_PREFIX

from project.util.site_util import absolute_reverse


MY_DIR = Path(__file__).parent.resolve()
USER_STATS_SQLFILE = MY_DIR / 'userstats.sql'


def execute_user_stats_query(cursor, include_pad_bbl: bool = False):
    admin_url_begin, admin_url_end = absolute_reverse(
        'admin:users_justfixuser_change', args=(999,)).split('999')
    cursor.execute(USER_STATS_SQLFILE.read_text(), {
        'include_pad_bbl': include_pad_bbl,
        'unusable_password_pattern': UNUSABLE_PASSWORD_PREFIX + '%',
        'admin_url_begin': admin_url_begin,
        'admin_url_end': admin_url_end
    })
