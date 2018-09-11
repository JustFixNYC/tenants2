import re
from difflib import unified_diff

from project.justfix_environment import BASE_DIR

README = BASE_DIR / 'README.md'
BASE_DOCKERFILE = BASE_DIR / 'Dockerfile'
PROD_DOCKERFILE = BASE_DIR / 'Dockerfile.web'

GITIGNORE = BASE_DIR / '.gitignore'
DOCKERIGNORE = BASE_DIR / '.dockerignore'


def strip_leading_comments(text):
    lines = []
    found_end_of_leading_comments = False
    for line in text.splitlines():
        if line.startswith('#') and not found_end_of_leading_comments:
            pass
        else:
            found_end_of_leading_comments = True
            lines.append(line)
    return '\n'.join(lines)


def get_match(pattern, path):
    text = path.read_text()
    match = re.search(pattern, text)
    if match is None:
        raise AssertionError(
            f'Could not find "{pattern}" in the contents of {path.name}!')
    return match.group(1)


def ensure_starts_with(path_1, path_2):
    p1_text = strip_leading_comments(path_1.read_text())
    p2_text = strip_leading_comments(path_2.read_text())
    if not p1_text.startswith(p2_text):
        errmsg = (
            f"{path_1.name} should start with the contents of {path_2.name} "
            f"(ignoring any leading comments) but it does not!"
        )
        diff = unified_diff(p2_text.splitlines(), p1_text.splitlines())
        print(errmsg)
        print('\nThe following diff may help you diagnose this problem:\n')
        print('\n'.join(diff))
        raise AssertionError(errmsg)


def ensure_file_contains(path, text):
    if text not in path.read_text():
        raise Exception(
            f'Expected to find "{text}" in the contents of {path.name}!')


def test_everything_uses_the_same_version_of_python():
    version = get_match(r'FROM python:(.+)', BASE_DOCKERFILE)
    ensure_file_contains(README, f'Python {version}')


def test_everything_uses_the_same_version_of_node():
    version = get_match(r'ENV NODE_VERSION=(.+)', BASE_DOCKERFILE)
    ensure_file_contains(README, f'Node {version}')


def test_dockerignore_starts_with_gitignore():
    ensure_starts_with(DOCKERIGNORE, GITIGNORE)


def test_prod_dockerfile_starts_with_base_dockerfile():
    ensure_starts_with(PROD_DOCKERFILE, BASE_DOCKERFILE)
