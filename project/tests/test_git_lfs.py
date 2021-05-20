from pathlib import Path


MY_DIR = Path(__file__).parent.resolve()

# This file is stored via git-lfs.
VENDORED_JS_FILE = MY_DIR / "test_git_lfs.js"


def test_git_lfs_has_checked_out_large_files():
    assert VENDORED_JS_FILE.exists()

    # If our file is actually checked out, and not just a
    # small text file that represents where to retrieve
    # the real file, it will contain JavaScript code.
    assert "function" in VENDORED_JS_FILE.read_text()
