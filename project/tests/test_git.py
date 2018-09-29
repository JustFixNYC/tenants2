from project.justfix_environment import BASE_DIR
from project.util import git


def test_is_dirty_returns_bool():
    assert isinstance(git.is_dirty(BASE_DIR), bool)


def test_has_extra_files_returns_bool():
    assert isinstance(git.has_extra_files(BASE_DIR), bool)


class TestGitInfo:
    def test_from_dir_or_env(self):
        assert git.have_git() is True
        assert git.is_git_repo(BASE_DIR) is True

        gitinfo = git.GitInfo.from_dir_or_env(BASE_DIR)
        assert len(gitinfo.GIT_REVISION) == 40
        assert isinstance(gitinfo.IS_GIT_REPO_PRISTINE, bool)

    def test_get_version_str_returns_rev_if_pristine(self):
        gitinfo = git.GitInfo(env={'GIT_REVISION': 'blah', 'IS_GIT_REPO_PRISTINE': 'True'})
        assert gitinfo.get_version_str() == 'blah'

    def test_get_version_str_works_if_not_pristine(self):
        gitinfo = git.GitInfo(env={'GIT_REVISION': 'blah', 'IS_GIT_REPO_PRISTINE': 'False'})
        assert gitinfo.get_version_str() == 'blah.modified'
