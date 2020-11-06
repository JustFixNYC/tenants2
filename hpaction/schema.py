from typing import Optional, List
import graphene
from graphene_django.types import DjangoObjectType
from graphql import ResolveInfo
from django.db import transaction
from django.urls import reverse
from django.forms import inlineformset_factory

from users.models import JustfixUser
from project.forms import CHOOSE_ONE_MSG
from project.util.session_mutation import SessionFormMutation
from project.util.email_attachment import EmailAttachmentMutation
from project import schema_registry, slack
from project.util.site_util import absolutify_url
from project.util.graphql_mailing_address import GraphQLMailingAddress
from project.util.model_form_util import (
    ManyToOneUserModelFormMutation,
    OneToOneUserModelFormMutation,
    create_model_for_user_resolver,
    create_models_for_user_resolver
)
from project.util.django_graphql_forms import DjangoFormMutation, FormWithFormsets
from issues.models import Issue, CustomIssue, ISSUE_AREA_CHOICES
from issues.schema import save_custom_issues_formset_with_area
import issues.forms
import loc.forms
from loc.models import LandlordDetails
from .models import (
    HPUploadStatus, COMMON_DATA, HP_ACTION_CHOICES, HPActionDocuments,
    DocusignEnvelope, HP_DOCUSIGN_STATUS_CHOICES, ManagementCompanyDetails)
import docusign.core
from . import models, forms, lhiapi, email_packet, docusign as hpadocusign
from .hpactionvars import HPActionVariables


def sync_emergency_issues(user, submitted_issues: List[str]):
    for area, all_area_issues in forms.EMERGENCY_HPA_ISSUES_BY_AREA.items():
        user_area_issues = Issue.objects.get_area_issues_for_user(user, area)
        for issue in all_area_issues:
            sync_one_value(issue, issue in submitted_issues, user_area_issues)
        Issue.objects.set_area_issues_for_user(user, area, user_area_issues)


@schema_registry.register_mutation
class BeginDocusign(DjangoFormMutation):
    class Meta:
        form_class = forms.BeginDocusignForm

    login_required = True

    redirect_url = graphene.String()

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        if not user.email:
            return cls.make_error("You have no email address!")

        if not user.is_email_verified:
            return cls.make_error("Your email address is not verified!")

        docs = HPActionDocuments.objects.get_latest_for_user(user, HP_ACTION_CHOICES.EMERGENCY)

        if not docs:
            return cls.make_error("You have no HP Action documents to sign!")

        api_client = docusign.core.create_default_api_client()
        de = DocusignEnvelope.objects.filter(docs=docs).first()

        if de is None:
            envelope_definition = hpadocusign.create_envelope_definition_for_hpa(docs)
            envelope_id = hpadocusign.create_envelope_for_hpa(
                envelope_definition=envelope_definition,
                api_client=api_client
            )
            slack.sendmsg_async(
                f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
                f"has started the Emergency HP Action signing ceremony! 🔥",
                is_safe=True
            )
            de = DocusignEnvelope(id=envelope_id, docs=docs)
            de.save()

        return_url = hpadocusign.create_callback_url_for_signing_flow(
            request,
            envelope_id=de.id,
            next_url=absolutify_url(form.cleaned_data['next_url']),
        )

        url = hpadocusign.create_recipient_view_for_hpa(
            user=user,
            envelope_id=de.id,
            api_client=api_client,
            return_url=return_url,
        )

        return cls(errors=[], redirect_url=url)


@schema_registry.register_mutation
class EmailHpActionPdf(EmailAttachmentMutation):
    attachment_name = "an HP Action packet"

    @classmethod
    def send_email(cls, user_id: int, recipients: List[str]):
        email_packet.email_packet_async(user_id, recipients)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        latest = HPActionDocuments.objects.get_latest_for_user(
            info.context.user, HP_ACTION_CHOICES.NORMAL)
        if latest is None:
            return cls.make_error("You do not have an HP Action packet to send!")
        return super().perform_mutate(form, info)


def sync_one_value(value: str, is_value_present: bool, values: List[str]) -> List[str]:
    '''
    Makes sure that the given value either is or isn't in the given list.

    Destructively modifies the list in-place and returns it.

    Examples:

        >>> sync_one_value('boop', False, ['boop', 'jones'])
        ['jones']
        >>> sync_one_value('boop', True, ['boop', 'jones'])
        ['boop', 'jones']
        >>> sync_one_value('boop', True, ['jones'])
        ['jones', 'boop']
        >>> sync_one_value('boop', False, ['jones'])
        ['jones']
    '''

    if is_value_present and value not in values:
        values.append(value)
    if not is_value_present and value in values:
        values.remove(value)
    return values


class LandlordInfoFormWithFormsets(FormWithFormsets):
    def get_formset_names_to_clean(self) -> List[str]:
        names: List[str] = []
        if not self.base_form.cleaned_data.get('use_recommended'):
            names.append('landlord')
            if self.base_form.cleaned_data.get('use_mgmt_co'):
                names.append('mgmt_co')
        return names


@schema_registry.register_mutation
class HpaLandlordInfo(ManyToOneUserModelFormMutation):
    class Meta:
        form_class = forms.LandlordExtraInfoForm

        # This is a bit weird since we're associating formset
        # factories with one-to-one fields; however, for now it's the
        # easiest way to shoehorn "sub-forms" into our form
        # infrastructure without having to overhaul it.
        formset_classes = {
            'landlord': inlineformset_factory(
                JustfixUser,
                LandlordDetails,
                loc.forms.LandlordDetailsFormV2,
                can_delete=False,
                min_num=1,
                max_num=1,
                validate_min=True,
                validate_max=True,
            ),
            'mgmt_co': inlineformset_factory(
                JustfixUser,
                ManagementCompanyDetails,
                forms.ManagementCompanyForm,
                can_delete=False,
                min_num=1,
                max_num=1,
                validate_min=True,
                validate_max=True,
            ),
        }

    @classmethod
    def get_form_with_formsets(cls, form, formsets):
        return LandlordInfoFormWithFormsets(form, formsets)

    @classmethod
    def get_formset_kwargs(cls, root, info: ResolveInfo, formset_name, input, all_input):
        # This automatically associates any existing OneToOneField instances with
        # formset forms, relieving clients of needing to know what their ID is.

        from django.db.models import OneToOneField

        formset = cls._meta.formset_classes[formset_name]
        if input and 'id' not in input[0] and isinstance(formset.fk, OneToOneField):
            instance = formset.fk.model.objects\
                .filter(**{formset.fk.name: info.context.user})\
                .first()
            if instance:
                input[0]['id'] = instance.pk

        return super().get_formset_kwargs(root, info, formset_name, input, all_input)

    @classmethod
    def __update_recommended_ll_info(cls, user):
        assert hasattr(user, 'onboarding_info')
        info = LandlordDetails.create_or_update_lookup_for_user(user)
        assert info is not None

    @classmethod
    def clear_mgmt_co_details(cls, user: JustfixUser):
        if hasattr(user, 'management_company_details'):
            mc = user.management_company_details
            mc.name = ''
            mc.clear_address()
            mc.save()

    @classmethod
    def update_manual_details(cls, form: LandlordInfoFormWithFormsets, user: JustfixUser):
        ll_form = form.formsets['landlord'].forms[0]
        ld = ll_form.save(commit=False)
        ld.is_looked_up = False
        ld.save()

        if form.base_form.cleaned_data['use_mgmt_co']:
            mgmt_co_form = form.formsets['mgmt_co'].forms[0]
            mgmt_co_form.save()
        else:
            cls.clear_mgmt_co_details(user)

    @classmethod
    def perform_mutate(cls, form: LandlordInfoFormWithFormsets, info: ResolveInfo):
        if form.base_form.cleaned_data['use_recommended']:
            cls.__update_recommended_ll_info(info.context.user)
        else:
            cls.update_manual_details(form, info.context.user)
        return cls.mutation_success()


@schema_registry.register_mutation
class EmergencyHPAIssues(ManyToOneUserModelFormMutation):
    class Meta:
        form_class = forms.EmergencyHPAIssuesForm
        formset_classes = {
            'custom_home_issues': inlineformset_factory(
                JustfixUser,
                CustomIssue,
                issues.forms.CustomIssueForm,
                can_delete=True,
                max_num=issues.forms.MAX_CUSTOM_ISSUES_PER_AREA,
                validate_max=True,
            )
        }

    login_required = True

    CUSTOM_ISSUE_AREA = ISSUE_AREA_CHOICES.HOME

    @classmethod
    def get_formset_kwargs(cls, root, info: ResolveInfo, formset_name, input, all_input):
        kwargs = super().get_formset_kwargs(root, info, formset_name, input, all_input)
        kwargs['queryset'] = CustomIssue.objects.filter(area=cls.CUSTOM_ISSUE_AREA)
        return kwargs

    @classmethod
    def get_number_of_custom_issues(cls, formset) -> int:
        return formset.total_form_count() - len(formset.deleted_forms)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        user = info.context.user
        issues: List[str] = form.base_form.cleaned_data['issues']
        formset = form.formsets['custom_home_issues']
        num_custom_issues = cls.get_number_of_custom_issues(formset)
        if len(issues) + num_custom_issues == 0:
            return cls.make_error(CHOOSE_ONE_MSG)
        with transaction.atomic():
            save_custom_issues_formset_with_area(formset, cls.CUSTOM_ISSUE_AREA)
            sync_emergency_issues(user, issues)
        return cls.mutation_success()


@schema_registry.register_mutation
class GenerateHpActionPdf(SessionFormMutation):
    class Meta:
        form_class = forms.GeneratePDFForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form: forms.GeneratePDFForm, info: ResolveInfo):
        user = info.context.user
        kind: str = form.cleaned_data['kind']
        token = models.UploadToken.objects.create_for_user(user, kind)
        lhiapi.async_get_answers_and_documents_and_notify(token.id)
        return cls.mutation_success()


class FeeWaiverType(DjangoObjectType):
    class Meta:
        model = models.FeeWaiverDetails
        exclude_fields = ('user', 'id')


class HPActionDetailsType(DjangoObjectType):
    class Meta:
        model = models.HPActionDetails
        exclude_fields = ('user', 'id')


class HarassmentDetailsType(DjangoObjectType):
    class Meta:
        model = models.HarassmentDetails
        exclude_fields = ('user', 'id')


class TenantChildType(DjangoObjectType):
    class Meta:
        model = models.TenantChild
        exclude_fields = ('user', 'created_at', 'updated_at')


class PriorHPActionCaseType(DjangoObjectType):
    class Meta:
        model = models.PriorCase
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
class HPActionSue(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.SueForm


@schema_registry.register_mutation
class HarassmentApartment(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.HarassmentApartmentForm


@schema_registry.register_mutation
class HarassmentAllegations1(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.HarassmentAllegations1Form


@schema_registry.register_mutation
class HarassmentAllegations2(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.HarassmentAllegations2Form


@schema_registry.register_mutation
class HarassmentExplain(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.HarassmentExplainForm


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
                max_num=COMMON_DATA['TENANT_CHILDREN_MAX_COUNT'],
                validate_max=True,
            )
        }


@schema_registry.register_mutation
class PriorHPActionCases(ManyToOneUserModelFormMutation):
    class Meta:
        formset_classes = {
            'cases': inlineformset_factory(
                JustfixUser,
                models.PriorCase,
                forms.PriorCaseForm,
                can_delete=True,
                max_num=10,
                validate_max=True,
            )
        }


def make_latest_hpa_pdf_field(kind: str):
    def resolver(root, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        if models.HPActionDocuments.objects.filter(
            user=request.user,
            kind=kind,
        ).exists():
            return f"{reverse('hpaction:latest_pdf', kwargs={'kind': kind.lower()})}"
        return None

    label = HP_ACTION_CHOICES.get_label(kind)
    field = graphene.String(
        description=(
            f"The URL of the most recently-generated {label} PDF "
            f"for the current user."
        ),
        resolver=resolver,
    )

    return field


UploadStatusEnum = graphene.Enum.from_enum(HPUploadStatus)


def make_hpa_upload_status_field(kind: str):
    def resolver(root, info: ResolveInfo) -> HPUploadStatus:
        request = info.context
        if not request.user.is_authenticated:
            return HPUploadStatus.NOT_STARTED
        return models.get_upload_status_for_user(request.user, kind)

    label = HP_ACTION_CHOICES.get_label(kind)
    field = graphene.Field(
        UploadStatusEnum,
        required=True,
        description=HPUploadStatus.__doc__.replace("HP Action", label),  # type: ignore
        resolver=resolver,
    )

    return field


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

    management_company_details = graphene.Field(
        GraphQLMailingAddress,
        description=(
            "Manually-specified details about the user's management company. "
            "Will only be non-blank if the user provided these details "
            "themselves (i.e., did not elect to use our recommended details "
            "from open data)."
        )
    )

    def resolve_management_company_details(self, info: ResolveInfo):
        user = info.context.user
        if hasattr(user, 'management_company_details'):
            return user.management_company_details
        return None

    latest_hp_action_pdf_url = make_latest_hpa_pdf_field(HP_ACTION_CHOICES.NORMAL)
    hp_action_upload_status = make_hpa_upload_status_field(HP_ACTION_CHOICES.NORMAL)

    latest_emergency_hp_action_pdf_url = make_latest_hpa_pdf_field(HP_ACTION_CHOICES.EMERGENCY)
    emergency_hp_action_upload_status = make_hpa_upload_status_field(HP_ACTION_CHOICES.EMERGENCY)
    emergency_hp_action_signing_status = graphene.Field(
        graphene.Enum.from_enum(HP_DOCUSIGN_STATUS_CHOICES.enum),
        description=(
            "The DocuSign signing status of the user's Emergency HP Action. If the "
            "signing process has not yet begun, this will be null."
        ),
    )

    tenant_children = graphene.List(
        graphene.NonNull(TenantChildType),
        resolver=create_models_for_user_resolver(models.TenantChild)
    )

    prior_hp_action_cases = graphene.List(
        graphene.NonNull(PriorHPActionCaseType),
        resolver=create_models_for_user_resolver(models.PriorCase)
    )

    def resolve_emergency_hp_action_signing_status(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return None
        docs = HPActionDocuments.objects.get_latest_for_user(user, HP_ACTION_CHOICES.EMERGENCY)
        if docs is None:
            return None
        de = DocusignEnvelope.objects.filter(docs=docs).first()
        if de is None:
            return None
        return HP_DOCUSIGN_STATUS_CHOICES.get_enum_member(de.status)


def _fill_user_landlord_info(info: ResolveInfo) -> Optional[HPActionVariables]:
    request = info.context
    user = request.user
    if user.is_authenticated:
        from .build_hpactionvars import fill_landlord_info
        v = HPActionVariables()
        if fill_landlord_info(v, user, use_user_landlord_details=False):
            return v
    return None


@schema_registry.register_queries
class HpQueries:
    recommended_hp_landlord = graphene.Field(
        GraphQLMailingAddress,
        description=(
            "The recommended landlord address for "
            "HP Action for the currently "
            "logged-in user, if any."
        )
    )

    def resolve_recommended_hp_landlord(self, info: ResolveInfo):
        v = _fill_user_landlord_info(info)
        if v:
            assert v.landlord_address_state_mc
            return GraphQLMailingAddress(
                name=v.landlord_entity_name_te,
                primary_line=v.landlord_address_street_te,
                city=v.landlord_address_city_te,
                state=v.landlord_address_state_mc.value,
                zip_code=v.landlord_address_zip_te,
            )
        return None

    recommended_hp_management_company = graphene.Field(
        GraphQLMailingAddress,
        description=(
            "The recommended management company address for "
            "HP Action for the currently "
            "logged-in user, if any."
        )
    )

    def resolve_recommended_hp_management_company(self, info: ResolveInfo):
        v = _fill_user_landlord_info(info)
        if v and v.management_company_name_te:
            assert v.management_company_address_state_mc
            return GraphQLMailingAddress(
                name=v.management_company_name_te,
                primary_line=v.management_company_address_street_te,
                city=v.management_company_address_city_te,
                state=v.management_company_address_state_mc.value,
                zip_code=v.management_company_address_zip_te,
            )
        return None
