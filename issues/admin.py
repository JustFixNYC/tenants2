from django.contrib import admin

from .models import Issue, CustomIssue


class IssueInline(admin.TabularInline):
    model = Issue
    verbose_name = "Housing issue"
    verbose_name_plural = "Housing issues"

    # This needs to be here, or else there will be an extremely bizarre
    # "Please correct the errors below" error with no actual errors
    # highlighted.
    readonly_fields = ('area', 'value')

    # We're not allowing this to be edited right now because it'd be really confusing,
    # given the coupling between the 'area' and 'value' fields.

    def has_add_permission(self, *args, **kwargs) -> bool:
        return False

    def has_change_permission(self, *args, **kwargs) -> bool:
        return False


class CustomIssueInline(admin.TabularInline):
    model = CustomIssue
    verbose_name = "Custom housing issue"
    verbose_name_plural = "Custom housing issues"
    extra = 1
