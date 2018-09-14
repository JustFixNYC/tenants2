from django.contrib import admin

from .models import OnboardingInfo


class OnboardingInline(admin.StackedInline):
    model = OnboardingInfo
    verbose_name = "Onboarding info"
    verbose_name_plural = verbose_name
