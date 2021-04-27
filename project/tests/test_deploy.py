from pathlib import Path
import contextlib
from unittest.mock import MagicMock
import json
import pytest

from project.util.testing_util import Snapshot
import deploy


def binary_encode_json(x):
    return json.dumps(x).encode("utf-8")


MY_DIR = Path(__file__).parent.resolve()

SNAPSHOT_DIR = MY_DIR / "test_deploy_snapshots"

DEFAULT_SUBPROCESS_CMD_PREFIX_OUTPUTS = {
    "git remote get-url": b"https://git.heroku.com/boop.git",
    "heroku config -j": binary_encode_json({"DATABASE_URL": "postgres://boop"}),
    "heroku features:info preboot --json": binary_encode_json({"enabled": False}),
    "git rev-parse HEAD": b"e7408710b8d091377041cfbe4c185931a214f280",
    "git status -uno --porcelain": b"M somefile.py",
    "heroku auth:token": b"00112233-aabb-ccdd-eeff-001122334455",
}


@pytest.fixture(autouse=True)
def fake_tempfile(monkeypatch):
    import tempfile

    @contextlib.contextmanager
    def fake_temporary_directory():
        yield "/tmp/somedir"

    monkeypatch.setattr(tempfile, "TemporaryDirectory", fake_temporary_directory)


def create_cmd_prefix_outputs(overrides=None):
    return {
        **DEFAULT_SUBPROCESS_CMD_PREFIX_OUTPUTS,
        **(overrides or {}),
    }


def create_check_output(cmd_prefix_outputs=None):
    cmd_prefix_outputs = create_cmd_prefix_outputs(cmd_prefix_outputs)

    def check_output(args, **kwargs):
        cmd = " ".join(args)
        for cmd_prefix, output in cmd_prefix_outputs.items():
            assert isinstance(output, bytes), f"Output for '{cmd_prefix}' must be bytes"
            if cmd.startswith(cmd_prefix):
                return output
        raise AssertionError(f"Unexpected check_output args: {args}")

    return check_output


def successful_check_call_with_print(args, **kwargs):
    cmd = " ".join(args)
    print(f'Running "{cmd}".')
    return 0


@pytest.fixture
def subprocess(monkeypatch):
    import subprocess

    monkeypatch.setattr(subprocess, "check_call", MagicMock())
    monkeypatch.setattr(subprocess, "check_output", MagicMock())
    monkeypatch.setattr(subprocess, "call", MagicMock())
    yield subprocess


@contextlib.contextmanager
def expect_normal_exit():
    with pytest.raises(SystemExit) as excinfo:
        yield
    assert excinfo.value.code == 0


@contextlib.contextmanager
def expect_abnormal_exit():
    with pytest.raises(SystemExit) as excinfo:
        yield
    assert excinfo.value.code != 0


def test_it_shows_help_when_asked_for_help(capsys):
    with expect_normal_exit():
        deploy.main(["--help"])
    assert "usage: " in capsys.readouterr().out


def test_it_shows_help_when_given_no_args(capsys):
    with expect_abnormal_exit():
        deploy.main([])
    assert "usage: " in capsys.readouterr().out


def test_selfcheck_works(capsys):
    deploy.main(["selfcheck"])
    assert "Deployment prerequisites satisfied" in capsys.readouterr().out


def test_heroku_raises_err_with_no_remote(capsys):
    with pytest.raises(ValueError, match="Please specify a git remote"):
        deploy.main(["heroku"])


def test_heroku_works(subprocess, capsys):
    subprocess.check_output.side_effect = create_check_output()
    subprocess.call.side_effect = successful_check_call_with_print
    subprocess.check_call.side_effect = successful_check_call_with_print

    deploy.main(["heroku", "-r", "myapp"])

    snapshot = Snapshot(capsys.readouterr().out, SNAPSHOT_DIR / "heroku_works.txt")
    assert snapshot.expected == snapshot.actual


def test_heroku_with_caching(subprocess, capsys):
    subprocess.check_output.side_effect = create_check_output()
    subprocess.call.side_effect = successful_check_call_with_print
    subprocess.check_call.side_effect = successful_check_call_with_print

    deploy.main(["heroku", "-r", "myapp", "--cache-from", "self", "--build-only"])

    snapshot = Snapshot(capsys.readouterr().out, SNAPSHOT_DIR / "heroku_with_caching.txt")
    assert snapshot.expected == snapshot.actual


def test_heroku_with_preboot(subprocess, capsys):
    subprocess.check_output.side_effect = create_check_output(
        {
            "heroku features:info preboot --json": json.dumps({"enabled": True}).encode("utf-8"),
        }
    )
    subprocess.call.side_effect = successful_check_call_with_print
    subprocess.check_call.side_effect = successful_check_call_with_print

    deploy.main(["heroku", "-r", "myapp"])

    snapshot = Snapshot(capsys.readouterr().out, SNAPSHOT_DIR / "heroku_with_preboot.txt")
    assert snapshot.expected == snapshot.actual
