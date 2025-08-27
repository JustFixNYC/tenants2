from django.contrib import admin

from project.util.admin_util import never_has_permission
from . import models


class UserDetailsInLine(admin.StackedInline):
    model = models.UserDetails
    fields = [
        "full_name",
        "phone_number",
        "email",
        "bbl",
        "primary_line",
        "secondary_line",
        "city",
        "zip_code",
    ]
    readonly_fields = fields

    has_add_permission = never_has_permission


class LandlordDetailsInLine(admin.StackedInline):
    model = models.LandlordDetails
    fields = [
        "name",
        "email",
        "primary_line",
        "secondary_line",
        "city",
        "zip_code",
    ]
    readonly_fields = fields

    has_add_permission = never_has_permission


@admin.register(models.GCELetter)
class GCELetterAdmin(admin.ModelAdmin):
    inlines = (
        UserDetailsInLine,
        LandlordDetailsInLine,
    )
    list_display = [
        "user_details",
        "landlord_details",
        "mail_choice",
        "email_to_landlord",
        "created_at",
        "letter_emailed_at",
        "letter_sent_at",
        "fully_processed_at",
    ]

    fields = [
        "locale",
        "mail_choice",
        "email_to_landlord",
        "created_at",
        "letter_emailed_at",
        "letter_sent_at",
        "fully_processed_at",
        "admin_pdf_url",
    ]

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission

    ordering = ["-created_at"]
