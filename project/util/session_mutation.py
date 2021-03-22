import graphene
from django.utils.module_loading import import_string

from .django_graphql_forms import DjangoFormMutation


class SessionFormMutation(DjangoFormMutation):
    """
    A base class that can be used for any form mutation
    that returns the current user's session.
    """

    class Meta:
        abstract = True

    session = graphene.Field("project.schema.SessionInfo")

    @classmethod
    def mutation_success(cls, **kwargs):
        """
        This can be returned by any perform_mutate() method
        to return a success condition along with the session.
        """

        return cls(errors=[], session=import_string("project.schema.SessionInfo")(), **kwargs)
