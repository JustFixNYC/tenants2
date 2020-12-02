import tempfile
from pathlib import Path


class TempDjangoFileStorage:
    """
    Represents a temporary directory for files stored
    by Django's file storage backend.
    """

    def __init__(self, dirname):
        self.dirname = dirname
        self.path = Path(dirname)

    def get_abs_path(self, django_fieldfile) -> Path:
        """
        Given a Django FieldFile that represents a file in a
        Django FileField that we know to be using Django's
        file storage backend, return its absolute path
        on the filesystem.
        """

        parts = django_fieldfile.name.split("/")
        return self.path.joinpath(*parts)

    def read(self, django_fieldfile) -> bytes:
        """
        Read the given Django FieldFile and return its bytes,
        closing the file before returning.

        Using this convenience method ensures that the file
        is closed properly, which means that deleting
        the temporary directory the file is in (which is
        done during teardown) won't raise any errors
        due to the file being in use.
        """

        f = django_fieldfile.open()
        data = f.read()
        f.close()
        return data


def django_file_storage(settings):
    """
    A test fixture that can be used to store any
    files stored via Django's file storage backend
    into a temporary directory. The directory
    is cleaned up at the end of the test.
    """

    with tempfile.TemporaryDirectory() as tmpdirname:
        settings.MEDIA_ROOT = tmpdirname
        settings.DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
        storage = TempDjangoFileStorage(tmpdirname)
        yield storage
