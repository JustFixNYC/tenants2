import subprocess
from typing import Iterator
from pathlib import Path
from django.core.management.base import BaseCommand

from project.justfix_environment import BASE_DIR


def iter_get_repo_files(repo_root: Path = BASE_DIR) -> Iterator[Path]:
    """
    Iterate through all existing files in the git repository.
    """

    # One big downside of this is that it only looks at files in
    # the git repository, *not* files in the current working
    # directory, which means that new files added but not yet
    # committed aren't actually iterated over.
    pathnames = (
        subprocess.check_output(
            [
                "git",
                "ls-tree",
                "--full-tree",
                "--name-only",
                "-r",
                "HEAD",
            ],
            cwd=BASE_DIR,
        )
        .decode("utf-8")
        .splitlines()
    )

    for pathname in pathnames:
        # git ls-tree always outputs posix-style pathnames, even on Windows.
        parts = pathname.split("/")
        path = repo_root.joinpath(*parts)
        # It's possible the path has been removed in the current branch
        # but hasn't been committed yet, so test to see if it exists
        # first.
        if path.exists():
            yield path


class Command(BaseCommand):
    help = "Ensure the project's text files all use Unix-style line endings."

    IGNORE_EXTENSIONS = [
        ".pdf",
        ".png",
        ".jpg",
        ".ttf",
        ".woff",
        ".woff2",
        ".ico",
        ".dbf",
        ".sbn",
        ".sbx",
        ".shp",
        ".shx",
        ".sketch",
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "filename",
            nargs="*",
            help=(
                "File to process. If unspecified, all files in the "
                "git repository are processed, excluding files ignored by git."
            ),
        )
        parser.add_argument(
            "--dry-run", help="don't actually change any files", action="store_true"
        )

    def convert_file(self, p: Path, dry_run: bool = False) -> bool:
        byte_contents = p.read_bytes()
        try:
            contents = byte_contents.decode("utf-8")
        except UnicodeDecodeError:
            self.stderr.write(
                f"WARNING: Unable to decode {p} as UTF-8.\n"
                f"If it is not a text file, consider adding its extension to IGNORE_EXTENSIONS\n"
                f"in {__file__}.\n"
            )
            return False
        crlfs = contents.count("\r\n")
        if crlfs == 0:
            return False
        self.stdout.write(f"Converting {crlfs} CRLFs to LFs in {p}.\n")
        contents = contents.replace("\r\n", "\n")
        if not dry_run:
            p.write_bytes(contents.encode("utf-8"))
        return True

    def handle(self, *args, **options):
        total = 0
        filenames = [Path(filename) for filename in options["filename"]]
        paths = filenames or iter_get_repo_files()

        for path in paths:
            if path.suffix not in self.IGNORE_EXTENSIONS:
                if self.convert_file(path, dry_run=options["dry_run"]):
                    total += 1

        if total == 0:
            self.stdout.write("Yay, all files have Unix-style line endings!")
