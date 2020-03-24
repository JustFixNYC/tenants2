from .factories import HPActionDocumentsFactory

from hpaction import docusign


def test_create_envelope_definition_for_hpa_works(db, django_file_storage):
    docs = HPActionDocumentsFactory()
    ed = docusign.create_envelope_definition_for_hpa(docs)
    assert len(ed.documents) == 1
    assert len(ed.recipients.signers) == 1
