"""Utilities for verifying git integrity."""

from typing import Dict, Type, TypeVar
from pathlib import Path
import subprocess

from .typed_environ import BaseEnvironment

# The following code is largely copy-pasted from mypy's source code:
#
# https://github.com/python/mypy/blob/master/mypy/git.py


def is_git_repo(dir: Path) -> bool:
    """Is the given directory version-controlled with git?"""
    return (dir / ".git").exists()


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
    try:
        output = subprocess.check_output(["git", "status", "-uno", "--porcelain"], cwd=dir)
    except subprocess.CalledProcessError:
        # No fucking clue why I am getting
        # 'fatal: failed to read object xyz: Operation not permitted'
        # on my system right now but I need to write code, not deal with this shit. -AV
        print(
            f"Warning: Checking repository for uncommitted changes failed, "
            f"reporting git repo as being dirty."
        )
        return True
    return output.strip() != b""


def has_extra_files(dir: Path) -> bool:
    """Check whether a git repository has untracked files."""
    output = subprocess.check_output(["git", "clean", "--dry-run", "-d"], cwd=dir)
    return output.strip() != b""


T = TypeVar("T", bound="GitInfo")


class GitInfo(BaseEnvironment):
    """
    We need some way of letting production deployments, which
    don't contain the project's git repository, what revision
    they're using. This class is used to do that, via
    environment variables.

    At the same time, we need an easy way to *generate* those
    environment variables from a Git repository, which this
    class also provides some utility methods for.
    """

    # The 40-character revision of the project's git repo.
    GIT_REVISION: str

    # Whether or not the git repo is "pristine", i.e. has no added or
    # changed files.
    IS_GIT_REPO_PRISTINE: bool

    @classmethod
    def create_env_dict(cls: Type[T], dir: Path) -> Dict[str, str]:
        return dict(
            GIT_REVISION=git_revision(dir).decode("ascii"),
            IS_GIT_REPO_PRISTINE=str(not is_dirty(dir) and not has_extra_files(dir)),
        )

    @classmethod
    def from_dir(cls: Type[T], dir: Path) -> T:
        return cls(env=cls.create_env_dict(dir))

    @classmethod
    def from_dir_or_env(cls: Type[T], dir: Path) -> T:
        """
        If the given directory is a git repository, pulls git info from there.
        Otherwise, it's assumed that the git revision information lives in the
        environment, and we'll pull it from there.
        """

        if have_git() and is_git_repo(dir):
            return cls.from_dir(dir)
        return cls()

    def get_version_str(self):
        """
        Returns a 40-character version identifier for the project. If the
        project isn't pristine, this will end in ".mod" (for "modified").
        """

        if self.IS_GIT_REPO_PRISTINE:
            return self.GIT_REVISION
        return f"{self.GIT_REVISION[:-4]}.mod"
