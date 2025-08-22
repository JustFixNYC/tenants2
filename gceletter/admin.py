from django.contrib import admin

from project.util.admin_util import never_has_permission
from .models import GCELetter


@admin.register(GCELetter)
class GCELetterAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "mail_choice"
        # "phone_number",
        # "bbl",
        # "first_name",
        # "house_number",
        # "street_name",
        # "borough",
    ]
    # TODO: add user and landlord details, see evictionfree/admin for example

    ordering = ["created_at"]

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission
