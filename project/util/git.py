"""Utilities for verifying git integrity."""

from typing import Dict
from pathlib import Path
import subprocess

from .typed_environ import BaseEnvironment

# The following code is largely copy-pasted from mypy's source code:
#
# https://github.com/python/mypy/blob/master/mypy/git.py


def is_git_repo(dir: Path) -> bool:
    """Is the given directory version-controlled with git?"""
    return (dir / '.git').exists()


def have_git() -> bool:
    """Can we run the git executable?"""
    try:
        subprocess.check_output(["git", "--help"])
        return True
    except subprocess.CalledProcessError:
        return False
    except OSError:
        return False


def git_revision(dir: Path) -> bytes:
    """Get the SHA-1 of the HEAD of a git repository."""
    return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=dir).strip()


def is_dirty(dir: Path) -> bool:
    """Check whether a git repository has uncommitted changes."""
    output = subprocess.check_output(["git", "status", "-uno", "--porcelain"], cwd=dir)
    return output.strip() != b""


def has_extra_files(dir: Path) -> bool:
    """Check whether a git repository has untracked files."""
    output = subprocess.check_output(["git", "clean", "--dry-run", "-d"], cwd=dir)
    return output.strip() != b""


class GitInfo(BaseEnvironment):
    GIT_REVISION: str

    IS_GIT_REPO_PRISTINE: bool

    @staticmethod
    def create_env_dict(dir: Path) -> Dict[str, str]:
        return dict(
            GIT_REVISION=git_revision(dir).decode('ascii'),
            IS_GIT_REPO_PRISTINE=str(not is_dirty(dir) and not has_extra_files(dir)),
        )

    @classmethod
    def from_dir_or_env(cls, dir: Path) -> 'GitInfo':
        if have_git() and is_git_repo(dir):
            return GitInfo(env=GitInfo.create_env_dict(dir))
        return GitInfo()

    def get_version_str(self):
        if self.IS_GIT_REPO_PRISTINE:
            return self.GIT_REVISION
        return f"{self.GIT_REVISION[:-4]}.mod"
