from pathlib import Path
from requests.exceptions import HTTPError, ReadTimeout
import pytest

from project.util.lambda_http_client import LambdaHttpClient
from project.justfix_environment import BASE_DIR

MY_DIR = Path(__file__).parent.resolve()

LAMBDA_SCRIPT = MY_DIR / "lambda_http_server.ts"


@pytest.fixture(scope="module")
def module_scoped_lambda_server():
    http = LambdaHttpClient(
        "test lambda http script",
        LAMBDA_SCRIPT,
        cwd=BASE_DIR,
        interpreter_args=["-r", "./frontend/webpack/babel-register"],
        restart_on_script_change=True,
    )
    yield http
    http.shutdown()


@pytest.fixture
def lambda_server(module_scoped_lambda_server, requests_mock):
    http = module_scoped_lambda_server
    requests_mock.register_uri("POST", http.get_url(), real_http=True)
    assert http.is_running is True
    yield http


def test_instacrash_raises_error():
    http = LambdaHttpClient("crashy", "", cwd=BASE_DIR, interpreter_args=["-e", r"process.exit(5)"])
    with pytest.raises(Exception, match="Subprocess failed with exit code 5"):
        http.get_url()
    assert http.is_running is False


def test_hanging_without_stdout_raises_error():
    http = LambdaHttpClient(
        "hang", "", cwd=BASE_DIR, timeout_secs=0.001, interpreter_args=["-e", r"while (1) {}"]
    )
    with pytest.raises(Exception, match="Subprocess produced no output within 0.001s"):
        http.get_url()
    assert http.is_running is False


def test_unparseable_port_raises_error():
    http = LambdaHttpClient(
        "bad_port", "", cwd=BASE_DIR, interpreter_args=["-e", r'console.log("SUP"); while (1) {}']
    )
    with pytest.raises(Exception, match="Could not parse port from line: b'SUP"):
        http.get_url()
    assert http.is_running is False


def test_unicode_works(lambda_server):
    assert lambda_server.run_handler({"echo": "here is some output\u2026"}) == {
        "echo": "here is some output\u2026"
    }
    assert lambda_server.is_running is True


def test_exceptions_in_requests_are_raised_as_http_500(lambda_server):
    with pytest.raises(HTTPError, match="500 Server Error"):
        lambda_server.run_handler({"explode": True})
    # The error should have shut down the misbehaving server.
    assert lambda_server.is_running is False


def test_hanging_in_requests_raises_timeout_error(lambda_server):
    with pytest.raises(ReadTimeout):
        lambda_server.run_handler({"hang": True}, timeout=0.0001)
    # The error should have shut down the misbehaving server.
    assert lambda_server.is_running is False
