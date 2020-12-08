import re
import logging
from django.conf import settings

IGNORE_PATHS = ["/favicon.ico", "/health"]

IGNORE_PATHS_PATTERN = "|".join([re.escape(path) for path in IGNORE_PATHS])

STATIC_REGEX = re.compile(
    r"GET (" + re.escape(settings.STATIC_URL) + ".*|" + IGNORE_PATHS_PATTERN + ")"
)


def skip_static_requests(record: logging.LogRecord) -> bool:
    """
    A logging filter that filters out requests for static
    assets.
    """

    if not (record.args and isinstance(record.args, tuple)):
        return True
    request_line = record.args[0]
    if isinstance(request_line, str) and STATIC_REGEX.match(request_line):
        return False
    return True
