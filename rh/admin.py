from django.contrib import admin

from project.util.admin_util import never_has_permission
from .models import RentalHistoryRequest


@admin.register(RentalHistoryRequest)
class RentalHistoryRequestAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "user",
        "first_name",
        "last_name",
        "address",
        "borough",
        "referral",
    ]

    ordering = ["created_at"]

    has_add_permission = never_has_permission
    has_change_permission = never_has_permission
    has_delete_permission = never_has_permission
