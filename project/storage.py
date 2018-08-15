from django.contrib.staticfiles.storage import StaticFilesStorage
from whitenoise.compress import Compressor


class CompressedStaticFilesStorage(StaticFilesStorage):
    def post_process(self, paths, **options):
        compressor = Compressor()
        for path in paths:
            if compressor.should_compress(path):
                abspath = self.path(path)
                for compressed_path in compressor.compress(abspath):
                    yield path, compressed_path, True
