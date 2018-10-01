import argparse
import sys
import subprocess
from typing import ItemsView, List

from project.justfix_environment import BASE_DIR
from project.util.git import GitInfo


def get_git_info_env_items() -> ItemsView[str, str]:
    return GitInfo.create_env_dict(BASE_DIR).items()


def build_local_container(container_name: str):
    args = [
        'docker',
        'build',
        '-f',
        'Dockerfile.web',
        '-t',
        container_name
    ]

    for name, value in get_git_info_env_items():
        args.append('--build-arg')
        args.append(f'{name}={value}')
    args.append('.')

    subprocess.check_call(
        args, cwd=BASE_DIR
    )


def run_local_container(container_name: str, port: int):
    subprocess.check_call([
        'docker',
        'run',
        '--rm',
        '-it',
        '-e',
        f'PORT={port}',
        '-p',
        f'{port}:{port}',
        '-e',
        'USE_DEVELOPMENT_DEFAULTS=yup',
        container_name
    ], cwd=BASE_DIR)


def deploy_local(args):
    container_name = 'tenants2'
    port = 8000

    build_local_container(container_name)
    run_local_container(container_name, port)


def heroku_cli(args: List[str]):
    call = subprocess.check_call

    # At least on Windows, Heroku seems to return non-zero
    # exit codes even when it's successful:
    #
    #     https://github.com/heroku/cli/issues/1051
    #
    # To avoid this problem we'll just ignore the exit code
    # if we're on windows.
    if sys.platform == 'win32':
        call = subprocess.call

    call(
        ['heroku'] + args,
        cwd=BASE_DIR,
        shell=True if sys.platform == 'win32' else False
    )


def deploy_heroku(args):
    heroku_cli(['maintenance:on'])
    heroku_cli([
        'container:push',
        '--arg',
        ','.join([
            f'{name}={value}'
            for name, value in get_git_info_env_items()
        ]),
        '--recursive',
    ])
    heroku_cli([
        'container:release',
        'web'
    ])
    if not args.no_migrate:
        heroku_cli([
            'run',
            '--exit-code',
            'python',
            'manage.py',
            'migrate'
        ])
    heroku_cli(['maintenance:off'])


def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(
        title='subcommands',
        description='valid subcommands',
    )
    parser_local = subparsers.add_parser(
        'local',
        help='Build container(s) and run everything locally.'
    )
    parser_local.set_defaults(func=deploy_local)

    parser_heroku = subparsers.add_parser(
        'heroku',
        help="Build container(s) and deploy to Heroku.",
    )
    parser_heroku.add_argument(
        '--no-migrate',
        action='store_true',
        help="Don't run database migrations."
    )
    parser_heroku.set_defaults(func=deploy_heroku)

    args = parser.parse_args()
    if not hasattr(args, 'func'):
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == '__main__':
    main()
