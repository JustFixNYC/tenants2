from django.contrib import admin

from project.util.admin_util import never_has_permission
from .models import Issue, CustomIssue


class IssueInline(admin.TabularInline):
    model = Issue
    verbose_name = "Housing issue"
    verbose_name_plural = "Housing issues"

    # This needs to be here, or else there will be an extremely bizarre
    # "Please correct the errors below" error with no actual errors
    # highlighted.
    readonly_fields = ("area", "value")

    # We're not allowing this to be edited right now because it'd be really confusing,
    # given the coupling between the 'area' and 'value' fields.
    has_add_permission = never_has_permission
    has_change_permission = never_has_permission


class CustomIssueInline(admin.TabularInline):
    model = CustomIssue
    verbose_name = "Custom housing issue"
    verbose_name_plural = "Custom housing issues"
    extra = 1
