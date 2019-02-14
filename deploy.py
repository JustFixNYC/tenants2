import os
import argparse
import sys
import subprocess
import json
from dataclasses import dataclass
from typing import ItemsView, List, Optional, Dict
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


def run_local_container(
    container_name: str,
    args: Optional[List[str]] = None,
    port: Optional[int] = None,
    env: Optional[Dict[str, str]] = None
) -> int:
    if env is None:
        env = {}
    if args is None:
        args = []
    final_args = [
        'docker',
        'run',
        '--rm',
        '-it',
    ]
    env = env.copy()
    if port is not None:
        env['PORT'] = str(port)
        final_args.extend(['-p', f'{port}:{port}'])
    final_env = os.environ.copy()
    for name, val in env.items():
        final_env[name] = val
        final_args.extend(['-e', name])
    final_args.append(container_name)
    final_args.extend(args)
    return subprocess.call(final_args, cwd=BASE_DIR, env=final_env)


def deploy_local(args):
    container_name = 'tenants2'
    port = 8000

    build_local_container(container_name)
    sys.exit(run_local_container(container_name, port=port, env={
        'USE_DEVELOPMENT_DEFAULTS': 'yup'
    }))


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

    def get_full_config(self) -> Dict[str, str]:
        result = subprocess.check_output(
            self._get_cmdline('config', '-j'),
            cwd=self.cwd,
            shell=self.shell
        )
        return json.loads(result)

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


def heroku_run(args):
    container_name = 'tenants2'

    build_local_container(container_name)
    heroku_config = HerokuCLI(args.remote).get_full_config()
    sys.exit(run_local_container(
        container_name,
        args=args.args,
        env=heroku_config
    ))


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

    parser_heroku_run = subparsers.add_parser(
        'heroku-run',
        help='Run local container using Heroku environment variables.',
    )
    parser_heroku_run.add_argument(
        '-r',
        '--remote',
        help="The git remote of the app to use."
    )
    parser_heroku_run.add_argument(
        'args',
        nargs=argparse.REMAINDER
    )
    parser_heroku_run.set_defaults(func=heroku_run)

    args = parser.parse_args()
    if not hasattr(args, 'func'):
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == '__main__':
    main()
