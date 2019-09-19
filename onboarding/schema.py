import logging
from typing import Optional, Dict, Any
from django.contrib.auth import login
from django.conf import settings
from django.http import HttpRequest
import graphene
from graphql import ResolveInfo
from graphene.types.objecttype import ObjectTypeOptions
from graphene_django.forms.mutation import fields_for_form
from graphene_django.types import DjangoObjectType
from django.db import transaction

from project.util.session_mutation import SessionFormMutation
from project.util.site_util import get_site_name
from project.util.django_graphql_forms import DjangoFormMutationOptions
from project import slack, schema_registry
from users.models import JustfixUser
from onboarding import forms
from onboarding.models import OnboardingInfo


# The onboarding steps we store in the request session.
SESSION_STEPS = [1, 2, 3]


logger = logging.getLogger(__name__)


def session_key_for_step(step: int) -> str:
    '''
    We store the results of the user's onboarding steps in
    the session. This function returns the key we use to
    store the data for a particular step in.
    '''

    assert step in SESSION_STEPS
    return f'onboarding_step_v{forms.FIELD_SCHEMA_VERSION}_{step}'


class SessionObjectTypeOptions(ObjectTypeOptions):
    form_class = None
    session_key: str = ''


class DjangoSessionFormObjectType(graphene.ObjectType):
    '''
    An abstract class for defining a GraphQL object type based on the
    fields of a Django Form, along with a resolver for retrieving them
    from a request session.
    '''

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        form_class=None,
        session_key='',
        _meta=None,
        **options
    ):
        if not _meta:
            _meta = SessionObjectTypeOptions(cls)

        assert session_key, f'{cls.__name__} must define Meta.session_key.'
        _meta.session_key = session_key

        assert form_class is not None, f'{cls.__name__} must define Meta.form_class.'
        _meta.form_class = form_class
        form = form_class()

        from graphene.types.utils import yank_fields_from_attrs
        from graphene.types.field import Field

        fields = yank_fields_from_attrs(fields_for_form(form, [], []), _as=Field)

        if _meta.fields:
            _meta.fields.update(fields)
        else:
            _meta.fields = fields

        super().__init_subclass_with_meta__(_meta=_meta, **options)

    @classmethod
    def _resolve_from_session(cls, parent, info: ResolveInfo):
        key = cls._meta.session_key
        request = info.context
        obinfo = request.session.get(key)
        if obinfo:
            try:
                return cls(**obinfo)
            except TypeError:
                # This can happen when we change the "schema" of an onboarding
                # step while a user's session contains data in the old schema.
                #
                # This should technically never happen if we remember to tie
                # the session key name to a version, e.g. "user_v1", but it's possible we
                # might forget to do that.
                logger.exception(f'Error deserializing {key} from session')
                request.session.pop(key)
        return None

    @classmethod
    def field(cls):
        return graphene.Field(cls, resolver=cls._resolve_from_session)


class OnboardingStep1Info(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.OnboardingStep1Form
        session_key = session_key_for_step(1)

    address_verified = graphene.Boolean(
        required=True,
        description=(
            "Whether the user's address was verified by a geocoder. "
            "If False, it is because the geocoder service was unavailable, "
            "not because the address is invalid."
        )
    )


class OnboardingStep2Info(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.OnboardingStep2Form
        session_key = session_key_for_step(2)


class OnboardingStep3Info(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.OnboardingStep3Form
        session_key = session_key_for_step(3)


class StoreToSessionFormOptions(DjangoFormMutationOptions):
    session_key: str = ''


class StoreToSessionForm(SessionFormMutation):
    '''
    Abstract base class that just stores the form's cleaned data to
    the current request's session.

    Concrete subclasses must define a Meta.source property that
    points to a concrete DjangoSessionFormObjectType subclass.
    '''

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        source=None,
        _meta=None,
        **options
    ):
        if not _meta:
            _meta = StoreToSessionFormOptions(cls)

        assert issubclass(
            source,
            DjangoSessionFormObjectType
        ), f'{cls.__name__} must define Meta.source.'
        _meta.session_key = source._meta.session_key
        options['form_class'] = source._meta.form_class

        super().__init_subclass_with_meta__(_meta=_meta, **options)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        request.session[cls._meta.session_key] = form.cleaned_data
        return cls.mutation_success()


@schema_registry.register_mutation
class OnboardingStep1(StoreToSessionForm):
    class Meta:
        source = OnboardingStep1Info


@schema_registry.register_mutation
class OnboardingStep2(StoreToSessionForm):
    class Meta:
        source = OnboardingStep2Info


@schema_registry.register_mutation
class OnboardingStep3(StoreToSessionForm):
    class Meta:
        source = OnboardingStep3Info


def pick_model_fields(model, **kwargs):
    '''
    Return a dictionary containing only the passed-in kwargs
    that correspond to fields on the given model, e.g.:

        >>> from django.contrib.auth.models import User
        >>> pick_model_fields(User, boop=1, username='blah')
        {'username': 'blah'}
    '''

    model_fields = set([field.name for field in model._meta.get_fields()])

    return {
        key: kwargs[key]
        for key in kwargs if key in model_fields
    }


@schema_registry.register_mutation
class OnboardingStep4(SessionFormMutation):
    class Meta:
        form_class = forms.OnboardingStep4Form

    @classmethod
    def __extract_all_step_session_data(cls, request: HttpRequest) -> Optional[Dict[str, Any]]:
        result: Dict[str, Any] = {}
        for step in SESSION_STEPS:
            if session_key_for_step(step) not in request.session:
                return None
        for step in SESSION_STEPS:
            key = session_key_for_step(step)
            result.update(request.session[key])
            del request.session[key]
        return result

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep4Form, info: ResolveInfo):
        request = info.context
        phone_number = form.cleaned_data['phone_number']
        password = form.cleaned_data['password'] or None
        prev_steps = cls.__extract_all_step_session_data(request)
        if prev_steps is None:
            cls.log(info, "User has not completed previous steps, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")
        with transaction.atomic():
            user = JustfixUser.objects.create_user(
                username=JustfixUser.objects.generate_random_username(),
                first_name=prev_steps['first_name'],
                last_name=prev_steps['last_name'],
                phone_number=phone_number,
                password=password,
            )

            oi = OnboardingInfo(user=user, **pick_model_fields(
                OnboardingInfo, **prev_steps, **form.cleaned_data))
            oi.full_clean()
            oi.save()

        user.send_sms_async(
            f"Welcome to {get_site_name()}, {user.first_name}! "
            f"We'll be sending you notifications from this phone number.",
        )
        slack.sendmsg_async(
            f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
            f"from {slack.escape(oi.borough_label)} has signed up!",
            is_safe=True
        )

        user.backend = settings.AUTHENTICATION_BACKENDS[0]
        login(request, user)
        return cls.mutation_success()


class OnboardingInfoType(DjangoObjectType):
    class Meta:
        model = OnboardingInfo
        only_fields = ('signup_intent', 'floor_number', 'address', 'borough')


@schema_registry.register_session_info
class OnboardingSessionInfo(object):
    '''
    A mixin class defining all onboarding-related queries.
    '''

    onboarding_step_1 = OnboardingStep1Info.field()
    onboarding_step_2 = OnboardingStep2Info.field()
    onboarding_step_3 = OnboardingStep3Info.field()
    onboarding_info = graphene.Field(
        OnboardingInfoType,
        description=(
            "The user's onboarding details, which they filled out "
            "during the onboarding process. This is not to be confused with "
            "the individual onboarding steps, which capture information "
            "someone filled out *during* onboarding, before they became "
            "a full-fledged user."
        )
    )

    def resolve_onboarding_info(self, info: ResolveInfo) -> Optional[OnboardingInfo]:
        user = info.context.user
        if hasattr(user, 'onboarding_info'):
            return user.onboarding_info
        return None
