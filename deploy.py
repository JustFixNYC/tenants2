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
    env: Optional[Dict[str, str]] = None,
    use_docker_compose: bool = False
) -> int:
    if env is None:
        env = {}
    if args is None:
        args = []
    final_args = [
        'docker-compose' if use_docker_compose else 'docker',
        'run',
        '--rm',
    ]
    if not use_docker_compose:
        final_args.append('-it')
    env = env.copy()
    final_env = os.environ.copy()
    for name, val in env.items():
        final_env[name] = val
        final_args.extend(['-e', name])
    final_args.append(container_name)
    final_args.extend(args)
    return subprocess.call(final_args, cwd=BASE_DIR, env=final_env)


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


class HerokuDeployer:
    def __init__(self, remote: str) -> None:
        if not remote:
            raise ValueError("Please specify a git remote corresponding to a Heroku app.")
        self.remote = remote
        self.app_name = self.get_heroku_app_name_from_git_remote(self.remote)
        self.process_type = 'web'
        self.heroku = HerokuCLI(self.remote)
        self.config = self.heroku.get_full_config()

    @staticmethod
    def get_heroku_app_name_from_git_remote(remote: str) -> str:
        url = subprocess.check_output([
            'git', 'remote', 'get-url', remote
        ]).decode('utf-8').strip()
        match = re.match(r'^https:\/\/git\.heroku\.com\/(.+)\.git$', url)
        if match is None:
            raise ValueError(f"Invalid Heroku remote: {remote}")
        return match[1]

    @property
    def container_tag(self) -> str:
        return f'registry.heroku.com/{self.app_name}/{self.process_type}'

    @property
    def is_using_cdn(self) -> bool:
        return len(self.config.get('AWS_STORAGE_STATICFILES_BUCKET_NAME', '')) > 0

    def run_in_container(self, args: List[str]) -> None:
        cmdline = ' '.join(args)
        returncode = run_local_container(self.container_tag, args, env=self.config)
        if returncode:
            raise Exception(f'Command failed: {cmdline}')

    def push_to_docker_registry(self) -> None:
        auth_token = self.heroku.get_auth_token()
        subprocess.check_call([
            'docker', 'login',
            '--username=_', f'--password={auth_token}',
            'registry.heroku.com'
        ])
        subprocess.check_call(['docker', 'push', self.container_tag])

    def pull_from_docker_registry(self) -> None:
        auth_token = self.heroku.get_auth_token()
        subprocess.check_call([
            'docker', 'login',
            '--username=_', f'--password={auth_token}',
            'registry.heroku.com'
        ])
        subprocess.check_call(['docker', 'pull', self.container_tag])

    def build_and_deploy(self) -> None:
        build_local_container(self.container_tag)

        print("Pushing container to Docker registry...")
        self.push_to_docker_registry()

        # We can upload static assets to the CDN without enabling
        # maintenance mode because static assets are hashed, so
        # they won't prevent existing users from using the site.
        if self.is_using_cdn:
            print("Uploading static assets to CDN...")
            self.run_in_container(['python', 'manage.py', 'collectstatic', '--noinput'])

        self.heroku.run('maintenance:on')

        # We want migrations to run while we're in maintenance mode because
        # our codebase doesn't make any guarantees about being able to run
        # on database schemas from previous or future versions.
        print("Running migrations...")
        self.run_in_container(['python', 'manage.py', 'migrate'])
        self.run_in_container(['python', 'manage.py', 'initgroups'])

        print("Initiating Heroku release phase...")
        self.heroku.run('container:release', self.process_type)

        self.heroku.run('maintenance:off')


def deploy_heroku(args):
    deployer = HerokuDeployer(args.remote)
    deployer.build_and_deploy()


def heroku_run(args):
    use_docker_compose: bool = args.use_docker_compose
    heroku_config = HerokuCLI(args.remote).get_full_config()
    if use_docker_compose:
        container_name = 'app'
    else:
        container_name = 'tenants2'
        build_local_container(container_name)

    sys.exit(run_local_container(
        container_name,
        args=args.args,
        env=heroku_config,
        use_docker_compose=use_docker_compose
    ))


def heroku_pull(args):
    deployer = HerokuDeployer(args.remote)
    deployer.pull_from_docker_registry()


def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(
        title='subcommands',
        description='valid subcommands',
    )

    parser_heroku = subparsers.add_parser(
        'heroku',
        help="Build container and deploy to Heroku.",
    )
    parser_heroku.add_argument(
        '-r',
        '--remote',
        default='',
        help="The git remote of the app to use."
    )
    parser_heroku.set_defaults(func=deploy_heroku)

    parser_heroku_run = subparsers.add_parser(
        'heroku-run',
        help='Run local container using Heroku environment variables.',
    )
    parser_heroku_run.add_argument(
        '-c',
        '--use-docker-compose',
        action='store_true',
        help='Use Docker Compose container instead of production container'
    )
    parser_heroku_run.add_argument(
        '-r',
        '--remote',
        default='',
        help="The git remote of the app to use."
    )
    parser_heroku_run.add_argument(
        'args',
        nargs=argparse.REMAINDER
    )
    parser_heroku_run.set_defaults(func=heroku_run)

    parser_heroku_pull = subparsers.add_parser(
        'heroku-pull',
        help='Pull container from Heroku Docker registry.'
    )
    parser_heroku_pull.add_argument(
        '-r',
        '--remote',
        default='',
        help="The git remote of the app to use."
    )
    parser_heroku_pull.set_defaults(func=heroku_pull)

    args = parser.parse_args()
    if not hasattr(args, 'func'):
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == '__main__':
    main()
