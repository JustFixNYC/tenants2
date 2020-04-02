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


@admin.register(models.HPActionDocuments)
class HPActionDocumentsAdmin(NoAddOrDeleteMixin, admin.ModelAdmin):
    list_display = [
        'id', 'user', 'kind', 'created_at'
    ]

    actions = [schedule_for_deletion]


class HPActionDocumentsInline(NoAddOrDeleteMixin, admin.TabularInline):
    model = models.HPActionDocuments

    fields = ['pdf_file', 'created_at']

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
