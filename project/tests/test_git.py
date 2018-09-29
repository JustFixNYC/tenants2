from project.justfix_environment import BASE_DIR
from project.util import git


def test_is_dirty_returns_bool():
    assert isinstance(git.is_dirty(BASE_DIR), bool)


def test_has_extra_files_returns_bool():
    assert isinstance(git.has_extra_files(BASE_DIR), bool)


def test_get_git_info_works():
    assert git.have_git() is True
    assert git.is_git_repo(BASE_DIR) is True

    gitinfo = git.get_git_info(BASE_DIR)
    assert len(gitinfo.GIT_REVISION) == 40
    assert isinstance(gitinfo.IS_GIT_REPO_PRISTINE, bool)
