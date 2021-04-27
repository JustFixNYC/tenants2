from graphql import ResolveInfo
from django.utils.translation import gettext as _

from project.util.django_graphql_forms import DjangoFormMutation


def mutation_requires_onboarding(func):
    def perform_mutate_wrapper(cls: DjangoFormMutation, form, info: ResolveInfo):
        user = info.context.user
        # Note that, annoyingly, an instance of onboarding info may have
        # been created by a OneToOneUserModelFormMutation or something else,
        # but it will be completely invalid, so we'll also check to see if
        # the onboarding info has actually been retrieved from the database
        # versus created on-the-fly.
        if not (hasattr(user, "onboarding_info") and user.onboarding_info.pk is not None):
            return cls.make_and_log_error(info, _("You haven't provided any account details yet!"))

        return func(cls, form, info)

    return perform_mutate_wrapper
