import datetime
from freezegun import freeze_time
from django.core.files.uploadedfile import SimpleUploadedFile

from users.tests.factories import UserFactory
from ..models import (
    HPActionDocuments, UploadToken, UPLOAD_TOKEN_LIFETIME)


def test_upload_tokens_are_time_limited_and_expired_ones_can_be_removed(db):
    with freeze_time('2018-01-01') as time:
        user = UserFactory()
        token = UploadToken.objects.create_for_user(user)
        UploadToken.objects.remove_expired()
        assert UploadToken.objects.find_unexpired(token.token) == token

        time.tick(delta=datetime.timedelta(seconds=1) + UPLOAD_TOKEN_LIFETIME)
        assert UploadToken.objects.find_unexpired(token.token) is None

        UploadToken.objects.remove_expired()
        assert UploadToken.objects.count() == 0


class TestHPActionDocuments:
    def test_purging_works(self, db, django_file_storage):
        user = UserFactory()
        docs = HPActionDocuments(
            xml_file=SimpleUploadedFile('blarg.xml', content=b'i am some xml'),
            pdf_file=SimpleUploadedFile('blarg.pdf', content=b'i am some pdf'),
            user=user
        )
        docs.save()

        HPActionDocuments.objects.purge()
        assert HPActionDocuments.objects.count() == 1

        xml_filepath = django_file_storage.get_abs_path(docs.xml_file)
        assert xml_filepath.exists()

        pdf_filepath = django_file_storage.get_abs_path(docs.pdf_file)
        assert pdf_filepath.exists()

        docs.schedule_for_deletion()
        HPActionDocuments.objects.purge()
        assert HPActionDocuments.objects.count() == 0
        assert not xml_filepath.exists()
        assert not pdf_filepath.exists()
