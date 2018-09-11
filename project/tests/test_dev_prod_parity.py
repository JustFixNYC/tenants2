import re

from project.justfix_environment import BASE_DIR

README = BASE_DIR / 'README.md'
DEV_DOCKERFILE = BASE_DIR / 'Dockerfile'
PROD_DOCKERFILE = BASE_DIR / 'Dockerfile.web'

GITIGNORE = BASE_DIR / '.gitignore'
DOCKERIGNORE = BASE_DIR / '.dockerignore'


def get_match(pattern, path):
    text = path.read_text()
    match = re.search(pattern, text)
    if match is None:
        raise AssertionError(
            f'could not find "{pattern}" in "{repr(text)}"')
    return match.group(1)


def ensure_dev_and_prod_match(pattern):
    dev_match = get_match(pattern, DEV_DOCKERFILE)
    prod_match = get_match(pattern, PROD_DOCKERFILE)
    assert dev_match == prod_match
    return dev_match


def test_everything_uses_the_same_version_of_python():
    version = ensure_dev_and_prod_match(r'FROM python:(.+)')
    assert f'Python {version}' in README.read_text()


def test_everything_uses_the_same_version_of_node():
    version = ensure_dev_and_prod_match(r'ENV NODE_VERSION=(.+)')
    assert f'Node {version}' in README.read_text()


def test_dockerignore_starts_with_gitignore():
    assert DOCKERIGNORE.read_text().startswith(GITIGNORE.read_text())
