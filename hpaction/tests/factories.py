from datetime import date
from pathlib import Path
import factory

from users.tests.factories import UserFactory
from .. import models


MY_DIR = Path(__file__).parent.resolve()

FAKE_HPA_PDF = MY_DIR / 'fake-hp-action-packet.pdf'


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

    xml_data = b'i am xml'

    pdf_data = FAKE_HPA_PDF.read_bytes()

    @classmethod
    def _create(self, model_class, *args, **kwargs):
        return models.HPActionDocuments.objects.create_from_file_data(*args, **kwargs)


class UploadTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.UploadToken

    user = factory.SubFactory(UserFactory)

    kind = models.HP_ACTION_CHOICES.NORMAL

    @classmethod
    def _create(self, model_class, user, kind):
        return models.UploadToken.objects.create_for_user(user, kind)


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
