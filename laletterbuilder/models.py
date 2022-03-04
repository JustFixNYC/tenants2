from project import common_data
from project.util.lob_models_util import LocalizedHTMLLetter
from users.models import JustfixUser
from django.db import models
from project.common_data import Choices


LETTER_TYPE_CHOICES = common_data.Choices.from_file("la-letter-builder-letter-choices.json")
ISSUE_CHOICES = Choices.from_file("issue-choices-laletterbuilder.json")
VALUE_MAXLEN = 60


class Letter(LocalizedHTMLLetter):
    """
    A LA Letter Builder letter that's ready to be sent, or has already been sent.
    """

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name="laletterbuilder_letters"
    )


class HabitabilityLetter(Letter):
    def __str__(self):
        if not self.pk:
            return super().__str__()
        return f"{self.user.full_legal_name}'s Habitability LA Letter Builder letter"


class LaIssue(models.Model):
    class  Meta:
        unique_together = ("letter", "value")
        ordering = ("value",)

    created_at = models.DateTimeField(auto_now_add=True, null=True)

    updated_at = models.DateTimeField(auto_now=True)

    letter = models.ForeignKey(
        HabitabilityLetter,
        on_delete=models.CASCADE,
        related_name="issues",
        help_text="The letter reporting the issue.",
    )

    value = models.CharField(
        max_length=VALUE_MAXLEN,
        choices=ISSUE_CHOICES.choices,
        help_text="The issue the user is reporting.",
    )