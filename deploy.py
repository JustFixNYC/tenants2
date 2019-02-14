import os
import argparse
import sys
import subprocess
import json
import re
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

    def get_auth_token(self) -> str:
        stdout = subprocess.check_output(
            ['heroku', 'auth:token'], cwd=self.cwd, shell=self.shell)
        return stdout.decode('utf-8').strip()


def get_heroku_app_name_from_git_remote(remote: Optional[str]) -> str:
    if not remote:
        raise ValueError("Please specify a git remote corresponding to a Heroku app.")
    url = subprocess.check_output([
        'git', 'remote', 'get-url', remote
    ]).decode('utf-8').strip()
    match = re.match(r'^https:\/\/git\.heroku\.com\/(.+)\.git$', url)
    if match is None:
        raise ValueError(f"Invalid Heroku remote: {remote}")
    return match[1]


def deploy_heroku(args):
    heroku_app = get_heroku_app_name_from_git_remote(args.remote)
    heroku_process_type = 'web'
    tag_name = f'registry.heroku.com/{heroku_app}/{heroku_process_type}'

    build_local_container(tag_name)

    heroku = HerokuCLI(args.remote)
    auth_token = heroku.get_auth_token()

    subprocess.check_call(['docker', 'login', '--username=_',
                           f'--password={auth_token}', 'registry.heroku.com'])
    subprocess.check_call(['docker', 'push', tag_name])

    config = heroku.get_full_config()

    def run_in_container(args: List[str]):
        cmdline = ' '.join(args)
        returncode = run_local_container(tag_name, args, env=config)
        if returncode:
            raise Exception(f'Command failed: {cmdline}')

    is_using_cdn = len(config.get('AWS_STORAGE_STATICFILES_BUCKET_NAME', '')) > 0
    if is_using_cdn:
        run_in_container(['python', 'manage.py', 'collectstatic', '--noinput'])

    heroku.run('maintenance:on')
    if not args.no_migrate:
        run_in_container(['python', 'manage.py', 'migrate'])
        run_in_container(['python', 'manage.py', 'initgroups'])
    heroku.run('container:release', 'web')
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
