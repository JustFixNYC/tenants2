from typing import List
from project import common_data
from project.util.lob_models_util import LocalizedHTMLLetter
from users.models import JustfixUser
from django.db import models, transaction
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


class LaIssueManager(models.Manager):
    """
    LAIssues are associated with the Letter rather than the User, to allow a user to have
    multiple letters in progress or to have multiple letter types with different Issues.
    That's why these models are different from the LOC issue models.
    """

    @transaction.atomic
    def set_issues_for_letter(self, letter: Letter, issues: List[str]):
        issues_set = set(issues)

        # Delete existing issues if they're not in the new list
        curr_models = list(self.filter(letter=letter))
        models_to_delete = [model for model in curr_models if model.value not in issues_set]
        for model in models_to_delete:
            model.delete()

        # Create the new issues, skipping duplicates
        values_that_already_exist = set(
            model.value for model in curr_models if model.value in issues_set
        )
        models_to_create = [
            LaIssue(letter=letter, value=value)
            for value in issues_set
            if value not in values_that_already_exist
        ]
        for model in models_to_create:
            model.full_clean()
            model.save()

    def get_issues_for_letter(self, letter: Letter) -> List[str]:
        return [issue.value for issue in self.filter(letter=letter)]


class LaIssue(models.Model):
    class Meta:
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
        help_text="The issue the letter is reporting.",
    )

    objects = LaIssueManager()
