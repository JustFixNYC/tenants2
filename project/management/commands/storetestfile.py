import datetime
from io import BytesIO
from django.conf import settings
from django.core.files.storage import DefaultStorage
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Store a test file using the current file storage settings."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-delete", help="don't delete test file when finished", action="store_true"
        )

    def make_file_contents(self) -> bytes:
        now = datetime.datetime.now()
        return (
            f"Hello, I am a test file created on {now} "
            f'by the "storetestfile" management command.'
        ).encode("ascii")

    def handle(self, *args, **options) -> None:
        no_delete = options["no_delete"]
        contents = self.make_file_contents()
        storage = DefaultStorage()
        self.stdout.write(f"Saving test file via {settings.DEFAULT_FILE_STORAGE}...\n")
        filename = storage.save("storetestfile_test_file.txt", BytesIO(contents))
        self.stdout.write(f'Test file saved as "{filename}".\n')
        try:
            self.stdout.write("Validating test file...\n")
            assert storage.exists(filename)
            self.stdout.write("Test file exists.\n")
            with storage.open(filename) as f:
                assert f.read() == contents
                self.stdout.write("Test file contents are valid.\n")
        finally:
            if no_delete:
                self.stdout.write(f'Please delete "{filename}" manually.')
            else:
                self.stdout.write("Deleting test file...\n")
                storage.delete(filename)
        self.stdout.write("Done!\n")
