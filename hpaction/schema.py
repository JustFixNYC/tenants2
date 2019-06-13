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
from .models import (
    FeeWaiverDetails, UploadToken, HPActionDocuments, HPUploadStatus,
    get_upload_status_for_user, TenantChild)
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
        token = UploadToken.objects.find_unexpired(self.token_id)
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
        token = UploadToken.objects.create_for_user(user)
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


class TenantChildType(DjangoObjectType):
    class Meta:
        model = models.TenantChild
        exclude_fields = ('user',)


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
class tenantChildren(ManyToOneUserModelFormMutation):
    class Meta:
        exclude_fields = ['user']
        formset_classes = {
            'children': inlineformset_factory(
                JustfixUser,
                TenantChild,
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
        resolver=create_model_for_user_resolver(FeeWaiverDetails)
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
        resolver=create_models_for_user_resolver(TenantChild)
    )

    def resolve_latest_hp_action_pdf_url(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        if HPActionDocuments.objects.filter(user=request.user).exists():
            return reverse('hpaction:latest_pdf')
        return None

    def resolve_hp_action_upload_status(self, info: ResolveInfo) -> HPUploadStatus:
        request = info.context
        if not request.user.is_authenticated:
            return HPUploadStatus.NOT_STARTED
        return get_upload_status_for_user(request.user)
