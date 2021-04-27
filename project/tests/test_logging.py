import logging
import pytest

from project.logging import skip_static_requests


def mkrecord(text: str) -> logging.LogRecord:
    return logging.makeLogRecord({"args": (text,)})


@pytest.mark.parametrize(
    "request_line,noskip",
    [
        ("GET /blarf HTTP/1.1", True),
        ("POST /static/a HTTP/1.1", True),
        ("GET /static/a HTTP/1.1", False),
        ("GET /static/a HTTP/1.0", False),
        ("GET /favicon.ico HTTP/1.1", False),
    ],
)
def test_skip_static_requests(request_line, noskip):
    assert skip_static_requests(mkrecord(request_line)) is noskip


def test_skip_static_requests_ignores_weirdly_typed_log_records():
    assert skip_static_requests(logging.makeLogRecord({"args": {"blah": 1}})) is True
    assert skip_static_requests(logging.makeLogRecord({"args": tuple()})) is True
    assert skip_static_requests(logging.makeLogRecord({"args": (1234,)})) is True
