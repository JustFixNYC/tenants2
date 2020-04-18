from django.contrib import admin
from django.utils.html import format_html

from project.util.admin_util import admin_field
from users.models import JustfixUser
from . import models


class NorentUser(JustfixUser):
    class Meta:
        proxy = True

        verbose_name = "NoRent.org user"


class NationalOnboardingInfoInline(admin.StackedInline):
    model = models.NationalOnboardingInfo


@admin.register(NorentUser)
class NorentUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name']

    fields = ['username', 'first_name', 'last_name', 'phone_number', 'email', 'edit_user']

    readonly_fields = ['edit_user']

    inlines = (
        NationalOnboardingInfoInline,
    )

    @admin_field(short_description="View/edit user details", allow_tags=True)
    def edit_user(self, obj):
        return format_html(
            '<a class="button" href="{}">View/edit user details</a>',
            obj.admin_url
        )
