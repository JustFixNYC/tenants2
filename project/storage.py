from django.contrib.staticfiles.storage import StaticFilesStorage
from whitenoise.compress import Compressor


class CompressedStaticFilesStorage(StaticFilesStorage):
    '''
    Attempts to compress the static files in a way that is
    compatible with Whitenoise's mechanism for serving compressed
    files.

    For more details, see:

        * https://github.com/evansd/whitenoise/issues/194
        * https://code.djangoproject.com/ticket/29677
    '''

    def post_process(self, paths, **options):
        compressor = Compressor()
        for path in paths:
            if compressor.should_compress(path):
                abspath = self.path(path)
                for compressed_path in compressor.compress(abspath):
                    yield path, compressed_path, True
