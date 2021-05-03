import factory

from ..models import JustfixUser
from ..permission_util import get_permissions_from_ns_codenames


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JustfixUser

    username = "boop"

    phone_number = "5551234567"

    password = "test123"

    first_name = "Boop"

    last_name = "Jones"

    @classmethod
    def _convert_full_legal_name(cls, kwargs):
        if "full_legal_name" in kwargs:
            first, last = kwargs["full_legal_name"].split(" ")
            kwargs["first_name"] = first
            kwargs["last_name"] = last
            del kwargs["full_legal_name"]
        return kwargs

    @classmethod
    def _convert_to_perms(cls, kwargs):
        if "user_permissions" in kwargs:
            perms = kwargs.pop("user_permissions")
            return get_permissions_from_ns_codenames(perms)
        return []

    @classmethod
    def _build(cls, model_class, *args, **kwargs):
        kwargs = cls._convert_full_legal_name(kwargs)
        return super()._build(model_class, *args, **kwargs)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        kwargs = cls._convert_full_legal_name(kwargs)
        perms = cls._convert_to_perms(kwargs)
        user = JustfixUser.objects.create_user(*args, **kwargs)
        if perms:
            user.user_permissions.set(perms)
        return user


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
