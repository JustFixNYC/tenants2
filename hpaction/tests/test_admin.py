from .factories import HPActionDocumentsFactory
from hpaction.models import HPActionDocuments
from hpaction.admin import schedule_for_deletion


def test_schedule_for_deletion_works(db, django_file_storage):
    doc = HPActionDocumentsFactory()
    assert doc.user is not None
    schedule_for_deletion(None, None, HPActionDocuments.objects.all())
    doc.refresh_from_db()
    assert doc.user is None
