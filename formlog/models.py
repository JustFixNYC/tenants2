import logging
from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import JSONField
from django.forms import Form

from users.models import JustfixUser


logger = logging.getLogger(__name__)


class SubmittedForm(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    form_class = models.CharField(
        max_length=500,
        help_text=(
            "The fully-qualified dotted name of the class for the form, "
            "e.g. 'onboarding.forms.OnboardingStep1Form'."
        )
    )

    data = JSONField(help_text="The data submitted to the form.")

    is_valid = models.BooleanField(
        help_text="Whether the form is valid (i.e., it has no validation errors).")

    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        null=True,
        help_text="The user who submitted the form, if any."
    )

    @staticmethod
    def from_form(form: Form, user=None) -> 'SubmittedForm':
        if not isinstance(user, JustfixUser):
            user = None
        full_class_name = f"{form.__module__}.{form.__class__.__name__}"
        return SubmittedForm(
            form_class=full_class_name,
            data=form.data,
            is_valid=form.is_valid(),
            user=user
        )


def log_form_submission(form: Form, user=None) -> None:
    if not isinstance(form, Form):
        logger.warning(f'{form.__class__.__name__} is not a Django Form instance.')
        return

    sf = SubmittedForm.from_form(form, user)
    sf.clean()

    if settings.ENABLE_FORMLOG:
        sf.save()
