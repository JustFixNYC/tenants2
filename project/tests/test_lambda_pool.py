import json
from io import BytesIO
from pathlib import Path
from subprocess import CalledProcessError, TimeoutExpired
import pytest

from project.util.lambda_pool import LambdaPool, MalformedResponseError

MY_DIR = Path(__file__).parent.resolve()

LAMBDA_SCRIPT = MY_DIR / "lambda_script.js"


@pytest.fixture(scope="module")
def pool():
    pool = LambdaPool("test lambda script", LAMBDA_SCRIPT, cwd=MY_DIR, stderr=BytesIO())
    yield pool
    pool.empty()


def test_output_is_returned(pool):
    assert pool.run_handler({"output": json.dumps({"here": "is some output\u2026"})}) == {
        "here": "is some output\u2026"
    }


def test_stderr_is_output(pool):
    pool.stderr = BytesIO()
    assert pool.run_handler({"stderr": "here is a stderr message", "output": '"hello"'}) == "hello"
    assert pool.stderr.getvalue() == b"here is a stderr message"


def test_stderr_is_not_output_if_disabled(pool):
    pool.stderr = BytesIO()
    assert (
        pool.run_handler(
            {"stderr": "here is a stderr message", "output": '"hello"'}, enable_stderr=False
        )
        == "hello"
    )
    assert pool.stderr.getvalue() == b""


def test_error_raised_if_output_is_malformed(pool):
    with pytest.raises(MalformedResponseError) as excinfo:
        pool.run_handler({"output": "this is not valid json"})
    assert b"this is not valid json" in excinfo.value.output


def test_error_raised_if_exit_code_is_nonzero(pool):
    with pytest.raises(CalledProcessError) as excinfo:
        pool.run_handler({"errorText": "uh-oh"})
    assert b"uh-oh" in excinfo.value.stderr


def test_error_raised_if_timeout_expires(pool):
    with pytest.raises(TimeoutExpired):
        pool.run_handler({"infiniteLoop": True}, timeout_secs=0.1)
