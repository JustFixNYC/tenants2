from django.contrib import admin

from . import models


class LetterInline(admin.TabularInline):
    model = models.Letter
    fields = ['user', 'created_at', 'tracking_number', 'letter_emailed_at']
    readonly_fields = fields


@admin.register(models.RentPeriod)
class RentPeriodAdmin(admin.ModelAdmin):
    list_display = ['payment_date']

    inlines = (
        LetterInline,
    )
