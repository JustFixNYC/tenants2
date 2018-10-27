import subprocess
from typing import Iterator
from pathlib import Path
from django.core.management.base import BaseCommand

from project.justfix_environment import BASE_DIR


def iter_get_repo_files(repo_root: Path=BASE_DIR) -> Iterator[Path]:
    pathnames = subprocess.check_output([
        'git',
        'ls-tree',
        '--full-tree',
        '--name-only',
        '-r',
        'HEAD',
    ], cwd=BASE_DIR).decode('utf-8').splitlines()

    for pathname in pathnames:
        # git ls-tree always outputs posix-style pathnames, even on Windows.
        parts = pathname.split('/')
        yield repo_root.joinpath(*parts)


class Command(BaseCommand):
    help = 'Ensure the project\'s text files all use Unix-style line endings.'

    IGNORE_EXTENSIONS = ['.png', '.jpg', '.ttf', '.ico']

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', help="don't actually change any files",
                            action='store_true')

    def convert_file(self, p: Path, dry_run: bool=False) -> bool:
        byte_contents = p.read_bytes()
        try:
            contents = byte_contents.decode('utf-8')
        except UnicodeDecodeError:
            self.stderr.write(f"WARNING: Unable to decode {p} as UTF-8.\n")
            return False
        crlfs = contents.count('\r\n')
        if crlfs == 0:
            return False
        self.stdout.write(f"Converting {crlfs} CRLFs to LFs in {p}.\n")
        contents = contents.replace('\r\n', '\n')
        if not dry_run:
            p.write_bytes(contents.encode('utf-8'))
        return True

    def handle(self, *args, **options):
        total = 0

        for path in iter_get_repo_files():
            if path.suffix not in self.IGNORE_EXTENSIONS:
                if self.convert_file(path, dry_run=options['dry_run']):
                    total += 1

        if total == 0:
            self.stdout.write('Yay, all files have Unix-style line endings!')
