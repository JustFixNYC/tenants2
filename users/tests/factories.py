import factory

from ..models import JustfixUser


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JustfixUser

    username = "boop"

    phone_number = "5551234567"

    password = "test123"

    first_name = "Boop"

    last_name = "Jones"

    @classmethod
    def _convert_full_name(cls, kwargs):
        if "full_name" in kwargs:
            first, last = kwargs["full_name"].split(" ")
            kwargs["first_name"] = first
            kwargs["last_name"] = last
            del kwargs["full_name"]
        return kwargs

    @classmethod
    def _build(cls, model_class, *args, **kwargs):
        kwargs = cls._convert_full_name(kwargs)
        return super()._build(model_class, *args, **kwargs)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        kwargs = cls._convert_full_name(kwargs)
        return JustfixUser.objects.create_user(*args, **kwargs)


class SecondUserFactory(UserFactory):
    """
    Convenience factory for creating a second user in addition
    to the defaults provided by UserFactory, without having
    to worry about uniqueness constraints being violated.
    """

    username = "bobby"

    phone_number = "5551239000"

    first_name = "Bobby"

    last_name = "Denver"
