from django.contrib import admin

from project.util.admin_util import admin_action, never_has_permission
from .models import HPActionDocuments


@admin_action("Mark selected documents for deletion")
def schedule_for_deletion(modeladmin, request, queryset):
    queryset.update(user=None)


class NoAddOrDeleteMixin:
    has_add_permission = never_has_permission
    has_delete_permission = never_has_permission


@admin.register(HPActionDocuments)
class HPActionDocumentsAdmin(NoAddOrDeleteMixin, admin.ModelAdmin):
    list_display = [
        'id', 'user', 'created_at'
    ]

    actions = [schedule_for_deletion]


class HPActionDocumentsInline(NoAddOrDeleteMixin, admin.TabularInline):
    model = HPActionDocuments

    fields = ['pdf_file', 'created_at']

    readonly_fields = fields

    ordering = ['-created_at']
