from django.contrib import admin

from .models import SubmittedForm


@admin.register(SubmittedForm)
class SubmittedFormAdmin(admin.ModelAdmin):
    list_display = ['form_class', 'user', 'is_valid', 'created_at']
