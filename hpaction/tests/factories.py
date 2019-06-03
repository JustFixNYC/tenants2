import factory

from users.tests.factories import UserFactory
from ..models import HPActionDocuments, UploadToken, FeeWaiverDetails


class HPActionDocumentsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = HPActionDocuments

    id = 'decafbad'

    user = factory.SubFactory(UserFactory)

    xml_data = b'i am xml'

    pdf_data = b'i am pdf'

    @classmethod
    def _create(self, model_class, *args, **kwargs):
        return HPActionDocuments.objects.create_from_file_data(*args, **kwargs)


class UploadTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UploadToken

    user = factory.SubFactory(UserFactory)

    @classmethod
    def _create(self, model_class, user):
        return UploadToken.objects.create_for_user(user)


class FeeWaiverDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FeeWaiverDetails

    user = factory.SubFactory(UserFactory)
