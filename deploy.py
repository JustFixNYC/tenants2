import argparse
import sys
import subprocess
from dataclasses import dataclass
from typing import ItemsView, List, Optional
from pathlib import Path

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


@dataclass
class HerokuCLI:
    remote: Optional[str]
    shell: bool = True if sys.platform == 'win32' else False
    cwd: Path = BASE_DIR

    def _get_cmdline(self, *args: str) -> List[str]:
        final_args = ['heroku'] + list(args)
        if self.remote:
            final_args += ['-r', self.remote]
        return final_args

    def run(self, *args: str):
        cmdline = self._get_cmdline(*args)
        subprocess.check_call(cmdline, cwd=self.cwd, shell=self.shell)

    def get_config(self, var: str) -> str:
        cmdline = self._get_cmdline('config:get', var)
        stdout = subprocess.check_output(cmdline, cwd=self.cwd, shell=self.shell)
        return stdout.strip()


def deploy_heroku(args):
    heroku = HerokuCLI(args.remote)

    run_cmds: List[str] = []

    is_using_cdn = len(heroku.get_config('AWS_STORAGE_STATICFILES_BUCKET_NAME')) > 0
    if is_using_cdn:
        run_cmds.append('python manage.py collectstatic --noinput')
    if not args.no_migrate:
        run_cmds.extend(['python manage.py migrate', 'python manage.py initgroups'])

    heroku.run('maintenance:on')
    heroku.run(
        'container:push',
        '--arg',
        ','.join([
            f'{name}={value}'
            for name, value in get_git_info_env_items()
        ]),
        '--recursive',
    )
    heroku.run('container:release', 'web')
    if run_cmds:
        heroku.run('run', '--exit-code', ' && '.join(run_cmds))
    heroku.run('maintenance:off')


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
        '-r',
        '--remote',
        help="The git remote of the app to use."
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
