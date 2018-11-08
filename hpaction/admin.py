from django.contrib import admin

from .models import HPActionDocuments


@admin.register(HPActionDocuments)
class HPActionDocumentsAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'created_at'
    ]

    def has_add_permission(self, *args, **kwargs) -> bool:
        return False

    def has_delete_permission(self, *args, **kwargs) -> bool:
        return False
