from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class S3StaticFilesStorage(S3Boto3Storage):
    CORS_CONFIG = {"CORSRules": [{"AllowedMethods": ["GET"], "AllowedOrigins": ["*"]}]}

    def __init__(self):
        super().__init__(
            bucket_name=settings.AWS_STORAGE_STATICFILES_BUCKET_NAME,
            gzip=True,
            default_acl="public-read",
            bucket_acl="public-read",
            querystring_auth=False,
        )

    def _get_or_create_bucket(self, name):
        bucket = super()._get_or_create_bucket(name)
        bucket.Cors().put(CORSConfiguration=self.CORS_CONFIG)
        return bucket
