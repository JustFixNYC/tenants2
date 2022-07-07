from typing import List
from project.common_data import Choices
from project.util.lob_models_util import LocalizedHTMLLetter
from users.models import JustfixUser
from django.db import models, transaction
from abc import abstractmethod


LETTER_TYPE_CHOICES = Choices.from_file("la-letter-builder-letter-choices.json")
LA_ISSUE_CHOICES = Choices.from_file("issue-choices-laletterbuilder.json")
LA_MAILING_CHOICES = Choices.from_file("laletterbuilder-mailing-choices.json")
VALUE_MAXLEN = 100


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

    mail_choice = models.TextField(
        max_length=30,
        choices=LA_MAILING_CHOICES.choices,
        help_text="How the letter will be mailed.",
        default=LA_MAILING_CHOICES.WE_WILL_MAIL,
    )
    email_to_landlord = models.BooleanField(
        default=False,
        help_text=(
            "Whether to email a copy of the letter to the landlord. "
            "Requires a landlord email to be provided"
        ),
    )

    pdf_base64 = models.TextField(
        help_text="A base64 encoded string representing the English content of the letter.",
        blank=True,
    )

    @abstractmethod
    def get_letter_type(self) -> str:
        ...


class HabitabilityLetter(Letter):
    def __str__(self):
        if not self.pk:
            return super().__str__()
        return f"{self.user.full_legal_name}'s Habitability LA Letter Builder letter"

    def get_letter_type(self) -> str:
        return LETTER_TYPE_CHOICES.HABITABILITY


def ensure_issue_is_valid(value: str):
    LA_ISSUE_CHOICES.validate_choices(value)


class LaIssueManager(models.Manager):
    """
    LaIssues are associated with the Letter rather than the User, to hypothetically
    allow a user to have multiple letters in progress.
    That's why these models are different from the NYLOC issue models.
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
        return [issue.value for issue in list(self.filter(letter=letter))]


class LaIssue(models.Model):
    class Meta:
        unique_together = ("letter", "value")
        ordering = ("value",)

    created_at = models.DateTimeField(auto_now_add=True, null=True)

    updated_at = models.DateTimeField(auto_now=True)

    letter = models.ForeignKey(
        HabitabilityLetter,
        on_delete=models.CASCADE,
        related_name="laletterbuilder_laissue",
        help_text="The letter reporting the issue.",
    )

    value = models.CharField(
        max_length=VALUE_MAXLEN,
        choices=LA_ISSUE_CHOICES.choices,
        help_text="The issue the letter is reporting.",
    )

    objects = LaIssueManager()

    def __str__(self):
        if not self.pk:
            return super().__str__()
        return f"Issue: {self.value}"

    def clean(self):
        ensure_issue_is_valid(self.value)
