from typing import Optional
from project.util.model_form_util import OneToOneUserModelFormMutation
from graphql import ResolveInfo
import graphene

from project import schema_registry
from project.util.session_mutation import SessionFormMutation
from . import forms, impersonation
from .email_verify import send_verification_email_async


@schema_registry.register_mutation
class SendVerificationEmail(SessionFormMutation):
    """
    Sends the currently logged-in user an email with a link
    to follow; when they follow the link, their account will be marked
    as having a verified email address.

    Note that this endpoint requires the user's email address. If
    the one provided is different from the one they currently have
    set, it will be changed, and their account will be marked as
    having an unverified email address (until they click on the
    link that has been sent to them, of course).
    """

    class Meta:
        form_class = forms.SendVerificationEmailForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        user = info.context.user
        email = form.cleaned_data["email"]
        if user.email != email:
            user.email = email
            user.is_email_verified = False
            user.save()
        send_verification_email_async(user.pk)
        return cls.mutation_success()


@schema_registry.register_mutation
class PhoneNumber(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.PhoneNumberForm


@schema_registry.register_mutation
class Unimpersonate(SessionFormMutation):
    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        other_user = impersonation.get_impersonating_user(request)
        if other_user is None:
            return cls.make_error("You are not currently impersonating another user.")
        impersonation.unimpersonate_user(request)
        return cls.mutation_success()


@schema_registry.register_session_info
class UserSessionInfo:
    impersonated_by = graphene.String(
        description=(
            "The name of the staff member who is impersonating the current user. "
            "If the current user isn't being impersonated by anyone, this will "
            "be null."
        )
    )

    def resolve_impersonated_by(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        other_user = impersonation.get_impersonating_user(request)
        if other_user is None:
            return None
        return other_user.best_first_name or other_user.username
