import os
import argparse
import sys
import subprocess
import json
import re
import tempfile
import contextlib
from dataclasses import dataclass
from typing import List, Optional, Dict
from pathlib import Path

from project.justfix_environment import BASE_DIR
from project.util.git import GitInfo


def build_container(
    dockerfile: str,
    build_context: str,
    container_name: str,
    cache_from: Optional[str] = None,
    build_args: Optional[Dict[str, str]] = None
):
    args = [
        'docker',
        'build',
        *(['--cache-from', cache_from] if cache_from else []),
        '-f',
        dockerfile,
        '-t',
        container_name
    ]

    if os.environ.get('DOCKER_BUILDKIT') == '1':
        print("Embedding BuildKit inline cache.")
        build_args = {
            **(build_args or {}),
            'BUILDKIT_INLINE_CACHE': '1',
        }

    for name, value in (build_args or {}).items():
        args.append('--build-arg')
        args.append(f'{name}={value}')

    args.append(build_context)

    subprocess.check_call(
        args, cwd=BASE_DIR
    )


def build_worker_container(container_name: str, dockerfile_web: str):
    # It's completely ridiculous that we're creating a temporary directory
    # just so we don't need to send a build context, but I'm not sure how
    # else to do this.
    with tempfile.TemporaryDirectory() as tmpdirname:
        build_container(
            dockerfile='Dockerfile.worker',
            build_context=tmpdirname,
            container_name=container_name,
            build_args={
                'DOCKERFILE_WEB': dockerfile_web
            }
        )


def build_local_container(container_name: str, cache_from: Optional[str] = None):
    build_container(
        dockerfile='Dockerfile.web',
        build_context='.',
        container_name=container_name,
        cache_from=cache_from,
        build_args=GitInfo.create_env_dict(BASE_DIR)
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
    if use_docker_compose:
        # We don't want the user's .justfix-env file defining any
        # variables that *aren't* defined in the existing environment,
        # so explicitly tell the app to *not* load it.
        final_args.extend(['-e', 'IGNORE_JUSTFIX_ENV_FILE=1'])
    else:
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

    def is_preboot_enabled(self, *args: str) -> bool:
        result = subprocess.check_output(
            self._get_cmdline('features:info', 'preboot', '--json'),
            cwd=self.cwd,
            shell=self.shell
        )
        return json.loads(result)['enabled']

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
        self.worker_process_type = 'worker'
        self.heroku = HerokuCLI(self.remote)
        self.config = self.heroku.get_full_config()
        self.is_logged_into_docker_registry = False

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
    def worker_container_tag(self) -> str:
        return f'registry.heroku.com/{self.app_name}/{self.worker_process_type}'

    @property
    def is_using_cdn(self) -> bool:
        return len(self.config.get('AWS_STORAGE_STATICFILES_BUCKET_NAME', '')) > 0

    @property
    def is_using_rollbar(self) -> bool:
        return len(self.config.get('ROLLBAR_SERVER_ACCESS_TOKEN', '')) > 0

    def run_in_container(self, args: List[str]) -> None:
        cmdline = ' '.join(args)
        returncode = run_local_container(self.container_tag, args, env=self.config)
        if returncode:
            raise Exception(f'Command failed: {cmdline}')

    def login_to_docker_registry(self) -> None:
        if not self.is_logged_into_docker_registry:
            auth_token = self.heroku.get_auth_token()
            subprocess.check_call([
                'docker', 'login',
                '--username=_', f'--password={auth_token}',
                'registry.heroku.com'
            ])
            self.is_logged_into_docker_registry = True

    def push_to_docker_registry(self) -> None:
        self.login_to_docker_registry()
        subprocess.check_call(['docker', 'push', self.container_tag])
        subprocess.check_call(['docker', 'push', self.worker_container_tag])

    def pull_from_docker_registry(self, tag: str) -> None:
        self.login_to_docker_registry()
        subprocess.check_call(['docker', 'pull', tag])

    def build(self, cache_from: str):
        if cache_from:
            if cache_from == 'self':
                cache_from = f"{self.container_tag}:latest"
            print(f"Caching from {cache_from}.")
            self.pull_from_docker_registry(cache_from)
            build_local_container(self.container_tag, cache_from=cache_from)
        else:
            build_local_container(self.container_tag)

        build_worker_container(self.worker_container_tag, dockerfile_web=self.container_tag)

    @contextlib.contextmanager
    def maintenance_mode_if_preboot_is_disabled(self):
        '''
        If Heroku preboot is disabled, wrap the enclosed code in Heroku's
        maintenance mode. Otherwise, we'll assume this is a zero-downtime
        deploy, e.g. that any migrations that do need to be run will be ones
        that the old version of the code is still compatible with.

        Note that if the enclosed code raises an exception, we do _not_
        disable maintenance mode, since we're assuming that the site
        is broken and maintainers will still need it to be in maintenance
        mode in order to fix it.
        '''

        is_preboot_enabled = self.heroku.is_preboot_enabled()

        if is_preboot_enabled:
            print("Heroku preboot is enabled, proceeding with zero-downtime deploy.")
        else:
            print("Heroku preboot is disabled, turning on maintenance mode.")
            self.heroku.run('maintenance:on')

        yield

        if not is_preboot_enabled:
            print("Turning off maintenance mode.")
            self.heroku.run('maintenance:off')

    def deploy(self) -> None:
        print("Pushing containers to Docker registry...")
        self.push_to_docker_registry()

        # We can upload static assets to the CDN without enabling
        # maintenance mode because static assets are hashed, so
        # they won't prevent existing users from using the site.
        if self.is_using_cdn:
            print("Uploading static assets to CDN...")
            self.run_in_container(['python', 'manage.py', 'collectstatic', '--noinput'])

            # We're disabling rollbar sourcemap integration for now because (A) rollbar
            # seems to ignore them and (B) their sourcemap upload endpoint isn't very
            # reliable, and we don't want that to block deploys. -AV

            # if self.is_using_rollbar:
            #     self.run_in_container(['python', 'manage.py', 'rollbarsourcemaps'])

        with self.maintenance_mode_if_preboot_is_disabled():
            # If Heroku preboot is disabled, then we want migrations to run while we're in
            # maintenance mode because we're assuming our codebase doesn't make any guarantees
            # about being able to run on database schemas from previous or future versions.
            print("Running migrations...")
            self.run_in_container(['python', 'manage.py', 'migrate'])
            self.run_in_container(['python', 'manage.py', 'initgroups'])

            print("Initiating Heroku release phase...")
            self.heroku.run('container:release', self.process_type, self.worker_process_type)

        print("Deploy finished.")


def deploy_heroku(args):
    deployer = HerokuDeployer(args.remote)
    deployer.build(cache_from=args.cache_from)
    if not args.build_only:
        deployer.deploy()


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


def selfcheck(args):
    from project.tests.test_git_lfs import test_git_lfs_has_checked_out_large_files

    test_git_lfs_has_checked_out_large_files()

    print("Deployment prerequisites satisfied!")


def main(args: Optional[List[str]] = None):
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(
        title='subcommands',
        description='valid subcommands',
    )

    parser_selfcheck = subparsers.add_parser(
        'selfcheck',
        help="Test build environment to make sure we can deploy a working build."
    )
    parser_selfcheck.set_defaults(func=selfcheck)

    parser_heroku = subparsers.add_parser(
        'heroku',
        help="Build containers and deploy to Heroku.",
    )
    parser_heroku.add_argument(
        '-r',
        '--remote',
        default='',
        help="The git remote of the app to use."
    )
    parser_heroku.add_argument(
        '--build-only',
        action='store_true',
        help="Build containers only (don't deploy)."
    )
    parser_heroku.add_argument(
        '--cache-from',
        default='',
        help=(
            "Pull a container image from a Docker registry and use it "
            "as a cache when building the container. Pass 'self' to use "
            "the latest container image from the Heroku Docker "
            "registry, or a fully-qualified image/tag name."
        )
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

    parsed_args = parser.parse_args(args)
    if not hasattr(parsed_args, 'func'):
        parser.print_help()
        sys.exit(1)

    parsed_args.func(parsed_args)


if __name__ == '__main__':
    main()
