from django.conf import settings
from django.contrib.staticfiles.storage import StaticFilesStorage
from whitenoise.compress import Compressor
from storages.backends.s3boto3 import S3Boto3Storage


class CompressedStaticFilesStorage(StaticFilesStorage):
    '''
    Attempts to compress the static files in a way that is
    compatible with Whitenoise's mechanism for serving compressed
    files.

    For more details, see:

        * https://github.com/evansd/whitenoise/issues/194
        * https://code.djangoproject.com/ticket/29677
    '''

    def _compress_path(self, path, compressor):
        if compressor.should_compress(path):
            abspath = self.path(path)
            for compressed_path in compressor.compress(abspath):
                yield path, compressed_path, True

    def post_process(self, paths, **options):
        compressor = Compressor()
        for path in paths:
            yield from self._compress_path(path, compressor)


class S3StaticFilesStorage(S3Boto3Storage):
    CORS_CONFIG = {
        'CORSRules': [
            {
                'AllowedMethods': ['GET'],
                'AllowedOrigins': ['*']
            }
        ]
    }

    def __init__(self):
        super().__init__(
            bucket_name=settings.AWS_STORAGE_STATICFILES_BUCKET_NAME,
            gzip=True,
            default_acl='public-read',
            bucket_acl='public-read',
            querystring_auth=False
        )

    def _get_or_create_bucket(self, name):
        bucket = super()._get_or_create_bucket(name)
        bucket.Cors().put(CORSConfiguration=self.CORS_CONFIG)
        return bucket
