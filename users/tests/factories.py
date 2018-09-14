import factory

from ..models import JustfixUser


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JustfixUser

    username = 'boop'

    phone_number = '5551234567'

    password = 'test123'

    full_name = 'Boop Jones'

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        return JustfixUser.objects.create_user(*args, **kwargs)
