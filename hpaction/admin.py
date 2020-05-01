from django.contrib import admin
from django.db.models import Q

from users.models import JustfixUser
from onboarding.models import SIGNUP_INTENT_CHOICES
from project.util.admin_util import admin_action, never_has_permission, make_edit_link
from project.admin import UserProxyAdmin
from . import models


@admin_action("Mark selected documents for deletion")
def schedule_for_deletion(modeladmin, request, queryset):
    queryset.update(user=None)


class NoAddOrDeleteMixin:
    has_add_permission = never_has_permission
    has_delete_permission = never_has_permission


@admin.register(models.Config)
class ConfigAdmin(NoAddOrDeleteMixin, admin.ModelAdmin):
    pass


class DocusignEnvelopeInline(admin.StackedInline):
    model = models.DocusignEnvelope

    fields = ['id', 'created_at', 'status']

    readonly_fields = ['id', 'created_at']

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


class HPActionDocumentsInline(NoAddOrDeleteMixin, admin.TabularInline):
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


@admin.register(HPUser)
class HPUserAdmin(UserProxyAdmin):
    inlines = (
        HPActionDetailsInline,
        TenantChildInline,
        PriorCaseInline,
        FeeWaiverDetailsInline,
        HarassmentDetailsInline,
        HPActionDocumentsInline,
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(
            Q(hp_action_details__isnull=False) |
            Q(onboarding_info__signup_intent__in=[
                SIGNUP_INTENT_CHOICES.HP,
                SIGNUP_INTENT_CHOICES.EHP
            ])
        )
