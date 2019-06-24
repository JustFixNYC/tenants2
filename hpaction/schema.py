from typing import Optional
from threading import Thread
import graphene
from graphene_django.types import DjangoObjectType
from graphql import ResolveInfo
from django.urls import reverse
from django.forms import inlineformset_factory

from users.models import JustfixUser
from project.util.session_mutation import SessionFormMutation
from project.util.site_util import absolute_reverse
from project import slack, schema_registry, common_data
from project.util.model_form_util import (
    ManyToOneUserModelFormMutation,
    OneToOneUserModelFormMutation,
    create_model_for_user_resolver,
    create_models_for_user_resolver
)
from .models import HPUploadStatus
from . import models, forms
from .build_hpactionvars import user_to_hpactionvars
from .hpactionvars import HPActionVariables
from . import lhiapi


COMMON_DATA = common_data.load_json("hp-action.json")


class GetAnswersAndDocumentsThread(Thread):
    '''
    A separate thread that attempts to generate the user's HP Action packet.
    Ideally this should be done in a worker queue but we don't have
    time to set one up right now, and this should take about a minute
    anyways, so it's unlikely that Heroku (or whatever else is running us)
    will kill us before we're done.
    '''

    def __init__(self, token_id: str, hdinfo: HPActionVariables) -> None:
        super().__init__()
        self.token_id = token_id
        self.hdinfo = hdinfo

    def run(self) -> None:
        token = models.UploadToken.objects.find_unexpired(self.token_id)
        assert token is not None
        user = token.user
        docs = lhiapi.get_answers_and_documents(token, self.hdinfo)
        if docs is not None:
            user.send_sms(
                f"JustFix.nyc here! Follow this link to your completed "
                f"HP Action legal forms. You will need to print these "
                f"papers before bringing them to court! "
                f"{absolute_reverse('hpaction:latest_pdf')}",
                fail_silently=True
            )
            slack.sendmsg(
                f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
                f"has generated HP Action legal forms!",
                is_safe=True
            )


GET_ANSWERS_AND_DOCUMENTS_ASYNC = True


@schema_registry.register_mutation
class GenerateHpActionPdf(SessionFormMutation):
    class Meta:
        form_class = forms.GeneratePDFForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form: forms.GeneratePDFForm, info: ResolveInfo):
        user = info.context.user
        hdinfo = user_to_hpactionvars(user)
        token = models.UploadToken.objects.create_for_user(user)
        thread = GetAnswersAndDocumentsThread(token.id, hdinfo)
        if GET_ANSWERS_AND_DOCUMENTS_ASYNC:
            thread.start()
        else:
            thread.run()
        return cls.mutation_success()


class FeeWaiverType(DjangoObjectType):
    class Meta:
        model = models.FeeWaiverDetails
        exclude_fields = ('user',)


class HPActionDetailsType(DjangoObjectType):
    class Meta:
        model = models.HPActionDetails
        exclude_fields = ('user',)


class HarassmentDetailsType(DjangoObjectType):
    class Meta:
        model = models.HarassmentDetails
        exclude_fields = ('user', 'id')


class TenantChildType(DjangoObjectType):
    class Meta:
        model = models.TenantChild
        exclude_fields = ('user', 'created_at', 'updated_at')


@schema_registry.register_mutation
class FeeWaiverMisc(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.FeeWaiverMiscForm


@schema_registry.register_mutation
class FeeWaiverIncome(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.FeeWaiverIncomeForm


@schema_registry.register_mutation
class FeeWaiverExpenses(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.FeeWaiverExpensesForm


@schema_registry.register_mutation
class FeeWaiverPublicAssistance(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.FeeWaiverPublicAssistanceForm


@schema_registry.register_mutation
class HPActionPreviousAttempts(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.PreviousAttemptsForm


@schema_registry.register_mutation
class HPActionUrgentAndDangerous(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.UrgentAndDangerousForm


@schema_registry.register_mutation
class HPActionSueForHarassment(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.SueForHarassmentForm


@schema_registry.register_mutation
class HarassmentApartment(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.HarassmentApartmentForm


@schema_registry.register_mutation
class HarassmentExplain(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.HarassmentExplainForm


@schema_registry.register_mutation
class HarassmentCaseHistory(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.HarassmentCaseHistoryForm


@schema_registry.register_mutation
class AccessForInspection(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.AccessForInspectionForm

    @classmethod
    def perform_mutate(cls, form, *args, **kwargs):
        if form.instance.id is None:
            # Database constraints will be violated if we actually try saving this,
            # so just return a validation error for now. This should never really
            # happen unless a user created via the admin UI or command-line was made.
            return cls.make_error("You must complete onboarding before submitting this form!")
        return super().perform_mutate(form, *args, **kwargs)


@schema_registry.register_mutation
class TenantChildren(ManyToOneUserModelFormMutation):
    class Meta:
        formset_classes = {
            'children': inlineformset_factory(
                JustfixUser,
                models.TenantChild,
                forms.TenantChildForm,
                can_delete=True,
                max_num=COMMON_DATA['maxChildren'],
                validate_max=True,
            )
        }


@schema_registry.register_session_info
class HPActionSessionInfo:
    fee_waiver = graphene.Field(
        FeeWaiverType,
        resolver=create_model_for_user_resolver(models.FeeWaiverDetails)
    )

    hp_action_details = graphene.Field(
        HPActionDetailsType,
        resolver=create_model_for_user_resolver(models.HPActionDetails)
    )

    harassment_details = graphene.Field(
        HarassmentDetailsType,
        resolver=create_model_for_user_resolver(models.HarassmentDetails)
    )

    latest_hp_action_pdf_url = graphene.String(
        description=(
            "The URL of the most recently-generated HP Action PDF "
            "for the current user."
        )
    )

    hp_action_upload_status = graphene.Field(graphene.Enum.from_enum(HPUploadStatus),
                                             required=True,
                                             description=HPUploadStatus.__doc__)

    tenant_children = graphene.List(
        graphene.NonNull(TenantChildType),
        resolver=create_models_for_user_resolver(models.TenantChild)
    )

    def resolve_latest_hp_action_pdf_url(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        if models.HPActionDocuments.objects.filter(user=request.user).exists():
            return reverse('hpaction:latest_pdf')
        return None

    def resolve_hp_action_upload_status(self, info: ResolveInfo) -> HPUploadStatus:
        request = info.context
        if not request.user.is_authenticated:
            return HPUploadStatus.NOT_STARTED
        return models.get_upload_status_for_user(request.user)
