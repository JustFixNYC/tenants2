import subprocess

from ..justfix_environment import BASE_DIR


def test_mypy():
    subprocess.check_call(['mypy', '.'], cwd=BASE_DIR)


def test_flake8():
    subprocess.check_call(['flake8'], cwd=BASE_DIR)


def test_graphql_schema():
    # TODO: We should actually try compiling the front-end
    # after this to make sure it still works, and
    # possibly also make sure that the generated
    # TypeScript code has't changed, i.e. that the
    # repo contains the latest version of the generated
    # code (at least during CI).
    subprocess.check_call(
        'npm run querybuilder',
        cwd=BASE_DIR,
        shell=True
    )
