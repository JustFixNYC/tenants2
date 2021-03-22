import datetime
from decimal import Decimal
from freezegun import freeze_time
from django.core.exceptions import ValidationError
import pytest

from users.tests.factories import UserFactory
from project.tests.util import strip_locale
from .factories import HPActionDocumentsFactory, UploadTokenFactory, PriorCaseFactory
from ..models import (
    HPActionDocuments,
    UploadToken,
    UPLOAD_TOKEN_LIFETIME,
    get_upload_status_for_user,
    HPUploadStatus,
    FeeWaiverDetails,
    HP_ACTION_CHOICES,
    Config,
    rel_short_date,
    CourtContact,
)


NORMAL = HP_ACTION_CHOICES.NORMAL


class TestCourtContact:
    def test_str_works(self):
        c = CourtContact(name="Boop Jones", email="boop@jones.net", court="STATEN_ISLAND")
        assert str(c) == "Boop Jones <boop@jones.net> at Staten Island housing court"

        c = CourtContact()
        assert str(c) == "CourtContact object (None)"


class TestUploadToken:
    def test_they_are_time_limited_and_expired_ones_can_be_removed(self, db):
        with freeze_time("2018-01-01") as time:
            token = UploadTokenFactory()
            UploadToken.objects.remove_expired()
            assert UploadToken.objects.find_unexpired(token.id) == token
            assert token.is_expired() is False

            time.tick(delta=datetime.timedelta(seconds=1) + UPLOAD_TOKEN_LIFETIME)
            assert UploadToken.objects.find_unexpired(token.id) is None
            assert token.is_expired() is True

            UploadToken.objects.remove_expired()
            assert UploadToken.objects.count() == 0

    def test_create_documents_from_works(self, db, django_file_storage):
        token = UploadTokenFactory(kind=HP_ACTION_CHOICES.EMERGENCY)
        user = token.user
        token_id = token.id
        docs = token.create_documents_from(xml_data=b"i am xml", pdf_data=b"i am pdf")
        assert django_file_storage.read(docs.xml_file) == b"i am xml"
        assert django_file_storage.read(docs.pdf_file) == b"i am pdf"
        assert docs.user == user
        assert docs.id == token_id
        assert docs.kind == "EMERGENCY"

        # Make sure the token was deleted.
        assert token.id is None

    def test_get_upload_url_works(self, db):
        token = UploadToken(id="boop")
        url = strip_locale(token.get_upload_url())
        assert url == "https://example.com/hp/upload/boop"


class TestHPActionDocuments:
    def create_docs(self, django_file_storage):
        docs = HPActionDocumentsFactory()
        xml_filepath = django_file_storage.get_abs_path(docs.xml_file)
        pdf_filepath = django_file_storage.get_abs_path(docs.pdf_file)
        return (docs, xml_filepath, pdf_filepath)

    def test_purging_works(self, db, django_file_storage):
        docs, xml_filepath, pdf_filepath = self.create_docs(django_file_storage)
        HPActionDocuments.objects.purge()
        assert HPActionDocuments.objects.count() == 1
        assert xml_filepath.exists()
        assert pdf_filepath.exists()

        docs.schedule_for_deletion()
        HPActionDocuments.objects.purge()
        assert HPActionDocuments.objects.count() == 0
        assert not xml_filepath.exists()
        assert not pdf_filepath.exists()

    def test_purging_works_on_partially_deleted_docs(self, db, django_file_storage):
        docs, xml_filepath, pdf_filepath = self.create_docs(django_file_storage)

        # Suppose we tried purging the docs before and deleting the XML file
        # worked, but deleting the PDF failed...
        docs.schedule_for_deletion()
        docs.xml_file.delete()
        assert not xml_filepath.exists()
        assert pdf_filepath.exists()

        # We should be able to purge again and complete the process.
        HPActionDocuments.objects.purge()
        assert not xml_filepath.exists()
        assert not pdf_filepath.exists()

    def test_get_latest_for_user_works(self, db, django_file_storage):
        user = UserFactory()

        docs = HPActionDocuments.objects.get_latest_for_user(user, NORMAL)
        assert docs is None

        with freeze_time("2018-01-01"):
            HPActionDocumentsFactory(user=user, id="older")

        docs = HPActionDocuments.objects.get_latest_for_user(user, NORMAL)
        assert docs and docs.id == "older"

        docs = HPActionDocuments.objects.get_latest_for_user(user, kind=None)
        assert docs and docs.id == "older"

        docs = HPActionDocuments.objects.get_latest_for_user(user, HP_ACTION_CHOICES.EMERGENCY)
        assert docs is None

        with freeze_time("2019-01-01"):
            HPActionDocumentsFactory(user=user, id="newer")

        docs = HPActionDocuments.objects.get_latest_for_user(user, NORMAL)
        assert docs and docs.id == "newer"


class TestGetUploadStatusForUser:
    def test_it_returns_not_started(self, db):
        assert get_upload_status_for_user(UserFactory(), NORMAL) == HPUploadStatus.NOT_STARTED

    def test_it_filters_by_kind(self, db):
        token = UploadTokenFactory(kind=HP_ACTION_CHOICES.EMERGENCY)
        assert get_upload_status_for_user(token.user, NORMAL) == HPUploadStatus.NOT_STARTED

    def test_it_returns_started(self, db):
        token = UploadTokenFactory()
        assert get_upload_status_for_user(token.user, NORMAL) == HPUploadStatus.STARTED

    def test_it_returns_errored_when_token_has_errored_set(self, db):
        token = UploadTokenFactory()
        token.errored = True
        token.save()
        assert get_upload_status_for_user(token.user, NORMAL) == HPUploadStatus.ERRORED

    def test_it_returns_errored_when_token_is_expired(self, db):
        with freeze_time("2018-01-01") as time:
            token = UploadTokenFactory()
            time.tick(delta=datetime.timedelta(days=1))
            assert get_upload_status_for_user(token.user, NORMAL) == HPUploadStatus.ERRORED

    def test_it_returns_succeeded(self, db, django_file_storage):
        docs = HPActionDocumentsFactory()
        assert get_upload_status_for_user(docs.user, NORMAL) == HPUploadStatus.SUCCEEDED

    def test_it_ignores_old_docs(self, db, django_file_storage):
        with freeze_time("2018-01-01") as time:
            docs = HPActionDocumentsFactory()
            time.tick(delta=datetime.timedelta(days=1))
            token = UploadTokenFactory(user=docs.user)
            assert get_upload_status_for_user(token.user, NORMAL) == HPUploadStatus.STARTED

    def test_it_ignores_old_tokens(self, db, django_file_storage):
        with freeze_time("2018-01-01") as time:
            token = UploadTokenFactory()
            time.tick(delta=datetime.timedelta(days=1))
            HPActionDocumentsFactory(user=token.user)
            assert get_upload_status_for_user(token.user, NORMAL) == HPUploadStatus.SUCCEEDED


class TestFeeWaiverDetails:
    def test_income_sources_works(self):
        f = FeeWaiverDetails()
        assert f.income_sources == []
        f.income_src_employment = True
        assert f.income_sources == ["Employment"]
        f.income_src_hra = True
        assert f.income_sources == ["Employment", "HRA"]
        f.income_src_other = "Boop"
        assert f.income_sources == ["Employment", "HRA", "Boop"]

    def test_non_utility_expenses_works(self):
        f = FeeWaiverDetails()
        assert f.non_utility_expenses == Decimal("0.00")
        f.expense_cable = Decimal("1.10")
        f.expense_other = Decimal("2.20")
        assert f.non_utility_expenses == Decimal("3.30")


class TestRelShortDate:
    def test_it_includes_year_when_it_is_different(self):
        with freeze_time("2020-01-01"):
            assert rel_short_date(datetime.date(2019, 1, 2)) == "2019-01-02"

    def test_it_omits_year_when_it_is_the_same(self):
        with freeze_time("2020-08-08"):
            assert rel_short_date(datetime.date(2020, 1, 2)) == "01-02"


class TestPriorCase:
    @pytest.mark.parametrize(
        "kwargs, expected",
        [
            [dict(is_harassment=False, is_repairs=True), "R"],
            [dict(is_harassment=True, is_repairs=True), "H&R"],
        ],
    )
    def test_case_type_works(self, kwargs, expected):
        assert PriorCaseFactory.build(**kwargs).case_type == expected

    def test_str_works(self):
        p = PriorCaseFactory.build()
        assert str(p) == "R #123456789 on 2018-01-03"

    @pytest.mark.parametrize(
        "kwargs",
        [
            dict(is_harassment=False, is_repairs=True),
            dict(is_harassment=True, is_repairs=False),
            dict(is_harassment=True, is_repairs=True),
        ],
    )
    def test_clean_does_not_raise_when_case_type_is_chosen(self, kwargs):
        p = PriorCaseFactory.build(**kwargs)
        p.clean()

    def test_clean_raises_when_case_type_is_not_chosen(self):
        p = PriorCaseFactory.build(is_harassment=False, is_repairs=False)
        with pytest.raises(ValidationError, match="Please select repairs and/or harassment"):
            p.clean()


def test_config_is_created_automatically(db):
    Config.objects.get()
