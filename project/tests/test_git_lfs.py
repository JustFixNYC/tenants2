from pathlib import Path


MY_DIR = Path(__file__).parent.resolve()

# This file is stored via git-lfs.
VEGA_EMBED_FILE = MY_DIR / ".." / "static" / "vendor" / "vega" / "vega-embed-4.0.0.min.js"


def test_git_lfs_has_checked_out_large_files():
    assert VEGA_EMBED_FILE.exists()

    # If our file is actually checked out, and not just a
    # small text file that represents where to retrieve
    # the real file, it will contain JavaScript code.
    assert "function" in VEGA_EMBED_FILE.read_text()
