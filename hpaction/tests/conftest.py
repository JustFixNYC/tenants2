import tempfile
from pathlib import Path
import pytest


class TempDjangoFileStorage:
    '''
    Represents a temporary directory for files stored
    by Django's file storage backend.
    '''

    def __init__(self, dirname):
        self.dirname = dirname
        self.path = Path(dirname)

    def get_abs_path(self, django_fieldfile):
        '''
        Given a Django FieldFile that represents a file in a
        Django FileField that we know to be using Django's
        file storage backend, return its absolute path
        on the filesystem.
        '''

        parts = django_fieldfile.name.split('/')
        return self.path.joinpath(*parts)


@pytest.fixture
def django_file_storage(settings):
    '''
    A test fixture that can be used to store any
    files stored via Django's file storage backend
    into a temporary directory. The directory
    is cleaned up at the end of the test.
    '''

    with tempfile.TemporaryDirectory() as tmpdirname:
        settings.MEDIA_ROOT = tmpdirname
        storage = TempDjangoFileStorage(tmpdirname)
        yield storage
