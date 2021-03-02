from graphql import ResolveInfo

from project.util.django_graphql_forms import DjangoFormMutation


def mutation_requires_onboarding(func):
    def perform_mutate_wrapper(cls: DjangoFormMutation, form, info: ResolveInfo):
        if not hasattr(info.context.user, "onboarding_info"):
            return cls.make_and_log_error(info, "You have not onboarded!")

        return func(cls, form, info)

    return perform_mutate_wrapper
