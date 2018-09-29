from project.justfix_environment import BASE_DIR
from project.util import git


def test():
    assert git.have_git() is True
    assert git.is_git_repo(BASE_DIR) is True
    assert len(git.git_revision(BASE_DIR)) == 40
    assert isinstance(git.is_dirty(BASE_DIR), bool)
    assert isinstance(git.has_extra_files(BASE_DIR), bool)
