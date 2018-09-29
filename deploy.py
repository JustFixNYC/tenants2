import argparse
import sys
import subprocess

from project.justfix_environment import BASE_DIR
from project.util.git import GitInfo


def build_local_container(container_name: str):
    args = [
        'docker',
        'build',
        '-f',
        'Dockerfile.web',
        '-t',
        container_name
    ]

    envdict = GitInfo.create_env_dict(BASE_DIR)
    for name, value in envdict.items():
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
    ])


def deploy_local(args):
    container_name = 'tenants2'
    port = 8000

    build_local_container(container_name)
    run_local_container(container_name, port)


def deploy_heroku(args):
    print("TODO heroku")


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
    parser_heroku.set_defaults(func=deploy_heroku)

    args = parser.parse_args()
    if not hasattr(args, 'func'):
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == '__main__':
    main()
