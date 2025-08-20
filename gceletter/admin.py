from django.contrib import admin

from project.util.admin_util import never_has_permission
from .models import GCELetter


@admin.register(GCELetter)
class GCELetterAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "phone_number",
        "bbl",
        "first_name",
        "house_number",
        "street_name",
        "borough",
    ]

    ordering = ["created_at"]

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission
