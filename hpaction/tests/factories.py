from datetime import date
from pathlib import Path
import factory

from users.tests.factories import UserFactory
from hpaction.hpactionvars import HPActionVariables
from .. import models


MY_DIR = Path(__file__).parent.resolve()

FAKE_HPA_REPAIRS_PDF = MY_DIR / 'fake-hpa-repairs.pdf'

FAKE_HPA_HARASSMENT_PDF = MY_DIR / 'fake-hpa-harassment.pdf'

FAKE_HPA_BOTH_PDF = MY_DIR / 'fake-hpa-both.pdf'


def make_hpa_xml(v: HPActionVariables) -> bytes:
    return str(v.to_answer_set()).encode('utf-8')


class TenantChildFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.TenantChild

    user = factory.SubFactory(UserFactory)

    name = 'Boop Jones Jr.'

    dob = date(2001, 10, 11)


class HPActionDocumentsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.HPActionDocuments

    id = 'decafbad'

    user = factory.SubFactory(UserFactory)

    xml_data = make_hpa_xml(HPActionVariables(
        sue_for_harassment_tf=False, sue_for_repairs_tf=True))

    pdf_data = FAKE_HPA_REPAIRS_PDF.read_bytes()

    @classmethod
    def _create(self, model_class, *args, **kwargs):
        return models.HPActionDocuments.objects.create_from_file_data(*args, **kwargs)


class HPActionDocumentsForRepairsFactory(HPActionDocumentsFactory):
    pass


class HPActionDocumentsForHarassmentFactory(HPActionDocumentsFactory):
    xml_data = make_hpa_xml(HPActionVariables(
        sue_for_harassment_tf=True, sue_for_repairs_tf=False))

    pdf_data = FAKE_HPA_HARASSMENT_PDF.read_bytes()


class HPActionDocumentsForBothFactory(HPActionDocumentsFactory):
    xml_data = make_hpa_xml(HPActionVariables(
        sue_for_harassment_tf=True, sue_for_repairs_tf=True))

    pdf_data = FAKE_HPA_BOTH_PDF.read_bytes()


class UploadTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.UploadToken

    user = factory.SubFactory(UserFactory)

    kind = models.HP_ACTION_CHOICES.NORMAL

    @classmethod
    def _create(self, model_class, user, kind):
        return models.UploadToken.objects.create_for_user(user, kind)


class DocusignEnvelopeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.DocusignEnvelope

    id = '3bd24c00-c870-452f-9e6f-68aa07d34fe7'

    docs = factory.SubFactory(HPActionDocumentsFactory)


class FeeWaiverDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.FeeWaiverDetails

    user = factory.SubFactory(UserFactory)


class HPActionDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.HPActionDetails

    user = factory.SubFactory(UserFactory)


class HarassmentDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.HarassmentDetails

    user = factory.SubFactory(UserFactory)


class PriorCaseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.PriorCase

    user = factory.SubFactory(UserFactory)

    case_number = '123456789'

    case_date = date(2018, 1, 3)

    is_repairs = True

    is_harassment = False
