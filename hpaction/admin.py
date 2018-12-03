from django.contrib import admin

from project.util.admin_util import admin_action
from .models import HPActionDocuments


def always_return_false(*args, **kwargs) -> bool:
    '''
    A function that always returns false regardless of what's passed to it.

    >>> always_return_false(1, 2, boop=3)
    False
    '''

    return False


@admin_action("Mark selected documents for deletion")
def schedule_for_deletion(modeladmin, request, queryset):
    queryset.update(user=None)


class NoAddOrDeleteMixin:
    has_add_permission = always_return_false
    has_delete_permission = always_return_false


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
