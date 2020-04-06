from django.contrib import admin
from django.utils.html import format_html

from users.models import JustfixUser
from project.util.admin_util import admin_field, admin_action, never_has_permission
import airtable.sync
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


@admin.register(models.HPActionDocuments)
class HPActionDocumentsAdmin(NoAddOrDeleteMixin, admin.ModelAdmin):
    list_display = [
        'id', 'user', 'user_full_name', 'kind', 'created_at'
    ]

    actions = [schedule_for_deletion]

    search_fields = ['id', 'user__username', 'user__first_name', 'user__last_name']

    def user_full_name(self, obj):
        if obj.user:
            return obj.user.full_name


class HPActionDocumentsInline(NoAddOrDeleteMixin, admin.TabularInline):
    model = models.HPActionDocuments

    fields = ['pdf_file', 'kind', 'created_at']

    readonly_fields = fields

    ordering = ['-created_at']


class HPUser(JustfixUser):
    class Meta:
        proxy = True

        verbose_name = "User HP Action"


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
class HPUserAdmin(airtable.sync.SyncUserOnSaveMixin, admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name']

    fields = ['username', 'first_name', 'last_name', 'phone_number', 'email', 'edit_user']

    readonly_fields = fields

    @admin_field(short_description="View/edit user details", allow_tags=True)
    def edit_user(self, obj):
        return format_html(
            '<a class="button" href="{}">View/edit user details</a>',
            obj.admin_url
        )

    inlines = (
        TenantChildInline,
        PriorCaseInline,
        HPActionDetailsInline,
        FeeWaiverDetailsInline,
        HarassmentDetailsInline,
        HPActionDocumentsInline,
    )


@admin.register(models.DocusignEnvelope)
class DocusignEnvelopeAdmin(admin.ModelAdmin):
    model = models.DocusignEnvelope

    list_display = ['id', 'created_at', 'user_full_name', 'status']

    ordering = ['-created_at']

    readonly_fields = ['id', 'docs', 'user_full_name']

    has_add_permission = never_has_permission

    search_fields = [
        'id', 'docs__user__username', 'docs__user__first_name',
        'docs__user__last_name',
    ]

    def user_full_name(self, obj):
        if obj.docs.user:
            return obj.docs.user.full_name
