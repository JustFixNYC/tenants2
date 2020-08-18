from django.contrib import admin
from django.db.models import Q
from django.urls import reverse
from django.utils.html import format_html

from users.models import JustfixUser
from issues.admin import IssueInline, CustomIssueInline
from loc.admin import LandlordDetailsInline
from loc.lob_api import is_lob_fully_enabled
from onboarding.models import SIGNUP_INTENT_CHOICES
from project.util.admin_util import (
    admin_action, never_has_permission, make_edit_link, admin_field)
from users.admin_user_proxy import UserProxyAdmin
from . import models


@admin_action("Mark selected documents for deletion")
def schedule_for_deletion(modeladmin, request, queryset):
    queryset.update(user=None)


class NoAddOrDeleteMixin:
    has_add_permission = never_has_permission
    has_delete_permission = never_has_permission


class ReadOnlyMixin(NoAddOrDeleteMixin):
    # Even if all the individual fields in the object are read-only, we need
    # to set this or else Django admin will fail on changes to other fields
    # this UI is embedded in with the error "Please correct the error below"
    # but no visible errors.
    has_change_permission = never_has_permission


@admin.register(models.Config)
class ConfigAdmin(NoAddOrDeleteMixin, admin.ModelAdmin):
    pass


@admin.register(models.CourtContact)
class ConfigAdmin(admin.ModelAdmin):
    pass


class DocusignEnvelopeInline(admin.StackedInline):
    model = models.DocusignEnvelope

    fields = ['id', 'created_at', 'status']

    # While "id" should really be in here, Django won't let us
    # actually make changes to the model if we add it, giving the notoriously
    # idiotic "Please correct the error below" without providing any
    # visible errors upon form submission.
    readonly_fields = ['created_at']

    ordering = ['-created_at']

    has_add_permission = never_has_permission


@admin.register(models.HPActionDocuments)
class HPActionDocumentsAdmin(NoAddOrDeleteMixin, admin.ModelAdmin):
    '''
    Admin for HP Action Documents. Ideally this would just be an inline
    admin for users, but because deletion is done by dissociating a
    user from the model, we basically have to make it a separate view.
    '''

    list_display = [
        'id', 'user', 'user_full_name', 'kind', 'created_at'
    ]

    actions = [schedule_for_deletion]

    search_fields = ['id', 'user__username', 'user__first_name', 'user__last_name']

    readonly_fields = ['edit_user']

    def user_full_name(self, obj):
        if obj.user:
            return obj.user.full_name

    inlines = (
        DocusignEnvelopeInline,
    )

    edit_user = make_edit_link("View/edit user details", field="user")


class HPActionDocumentsInline(ReadOnlyMixin, admin.TabularInline):
    model = models.HPActionDocuments

    fields = ['pdf_file', 'kind', 'created_at', 'docusign_status', 'edit']

    readonly_fields = fields

    ordering = ['-created_at']

    edit = make_edit_link("Edit")

    def docusign_status(self, obj):
        if hasattr(obj, 'docusignenvelope'):
            return obj.docusignenvelope.status


class HPUser(JustfixUser):
    class Meta:
        proxy = True

        verbose_name = "User with HP Action"

        verbose_name_plural = "Users with HP Actions"


class HPActionDetailsInline(admin.StackedInline):
    model = models.HPActionDetails


class FeeWaiverDetailsInline(admin.StackedInline):
    model = models.FeeWaiverDetails


class HarassmentDetailsInline(admin.StackedInline):
    model = models.HarassmentDetails


class TenantChildInline(admin.TabularInline):
    model = models.TenantChild

    extra = 1


class PriorCaseInline(admin.TabularInline):
    model = models.PriorCase

    extra = 1


class ServingPapersInline(NoAddOrDeleteMixin, admin.StackedInline):
    model = models.ServingPapers
    fk_name = 'sender'
    exclude = ['lob_letter_object']
    has_change_permission = never_has_permission


@admin.register(HPUser)
class HPUserAdmin(UserProxyAdmin):
    fields = UserProxyAdmin.fields + ['create_serving_papers']

    readonly_fields = fields

    inlines = (
        HPActionDetailsInline,
        IssueInline,
        CustomIssueInline,
        TenantChildInline,
        PriorCaseInline,
        HarassmentDetailsInline,
        FeeWaiverDetailsInline,
        LandlordDetailsInline,
        HPActionDocumentsInline,
        ServingPapersInline,
    )

    def filter_queryset_for_changelist_view(self, queryset):
        return queryset.filter(
            Q(hp_action_details__isnull=False) |
            Q(onboarding_info__signup_intent__in=[
                SIGNUP_INTENT_CHOICES.HP,
                SIGNUP_INTENT_CHOICES.EHP
            ])
        )

    @admin_field(
        short_description='Create serving papers',
        allow_tags=True
    )
    def create_serving_papers(self, obj):
        if not is_lob_fully_enabled():
            return "Lob integration is disabled."
        if not models.ServingPapers.can_user_serve_papers(obj):
            return "We don't have enough information about this user to serve papers yet."
        return format_html(
            '<a class="button" href="{}">Create and mail serving papers via Lob&hellip;</a>',
            reverse('admin:create-serving-papers', kwargs={'userid': obj.id})
        )
