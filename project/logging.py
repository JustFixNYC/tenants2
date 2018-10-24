import re
from django.conf import settings

IGNORE_PATHS = [
    '/favicon.ico',
]

IGNORE_PATHS_PATTERN = '|'.join([
    re.escape(path) for path in IGNORE_PATHS])

STATIC_REGEX = re.compile(
    r'GET (' + re.escape(settings.STATIC_URL) + '.*|' +
    IGNORE_PATHS_PATTERN + ')'
)


def skip_static_requests(record) -> bool:
    if STATIC_REGEX.match(record.args[0]):
        return False
    return True
