from typing import List
from project.common_data import Choices
from project.util.lob_models_util import LocalizedHTMLLetter
from users.models import JustfixUser
from django.db import models, transaction
from abc import abstractmethod


#LETTER_TYPE_CHOICES = Choices.from_file("la-letter-builder-letter-choices.json")
#LA_ISSUE_CHOICES = Choices.from_file("issue-choices-laletterbuilder.json")
GCE_ISSUE_CHOICES = Choices.from_file("lettersender-gce-issue-choices.json")
LA_MAILING_CHOICES = Choices.from_file("laletterbuilder-mailing-choices.json")
VALUE_MAXLEN = 100


class LetterSenderLetter(LocalizedHTMLLetter):
    """
    A Letter Sender letter that's ready to be sent, or has already been sent.
    """

    class Meta:
        ordering = ["-created_at"]

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name="lettersender_letters"
    )

    mail_choice = models.TextField(
        max_length=30,
        choices=LA_MAILING_CHOICES.choices,
        help_text="How the letter will be mailed.",
        default=LA_MAILING_CHOICES.WE_WILL_MAIL,
    )
    email_to_landlord = models.BooleanField(
        null=True,
        blank=True,
        help_text=(
            "Whether to email a copy of the letter to the landlord. "
            "Requires a landlord email to be provided"
        ),
    )

    pdf_base64 = models.TextField(
        help_text="A base64 encoded string representing the English content of the letter.",
        blank=True,
    )

    def __str__(self):
        if not self.pk:
            return super().__str__()
        return f"{self.user.full_legal_name}'s Letter Sender letter"


class LetterSenderOverchargeDetails(models.Model):
    """
    Additional details about overcharge situations for lettersender users.
    """
    
    user = models.OneToOneField(
        JustfixUser, 
        on_delete=models.CASCADE, 
        related_name="lettersender_overcharge_details"
    )
    
    overcharge_applies = models.BooleanField(
        help_text="Whether the overcharge situation applies to the user."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Letter Sender Overcharge Details"
        verbose_name_plural = "Letter Sender Overcharge Details"
    
    def __str__(self):
        return f"Overcharge details for {self.user.full_legal_name}"


def ensure_issue_is_valid(value: str):
    GCE_ISSUE_CHOICES.validate_choices(value)


class LetterSenderIssueManager(models.Manager):
    """
    LetterSenderIssues are associated with the Letter rather than the User, to hypothetically
    allow a user to have multiple letters in progress.
    That's why these models are different from the NYLOC issue models.
    """

    @transaction.atomic
    def set_issues_for_letter(self, letter: LetterSenderLetter, issues: List[str]):
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
            LetterSenderIssue(letter=letter, value=value)
            for value in issues_set
            if value not in values_that_already_exist
        ]

        for model in models_to_create:
            model.full_clean()
            model.save()

    def get_issues_for_letter(self, letter: LetterSenderLetter) -> List[str]:
        return [issue.value for issue in list(self.filter(letter=letter))]


class LetterSenderIssue(models.Model):
    """
    An issue that a user has selected for their letter.
    """

    letter = models.ForeignKey(
        LetterSenderLetter, on_delete=models.CASCADE, related_name="lettersender_gce_issues"
    )
    value = models.CharField(
        max_length=VALUE_MAXLEN,
        choices=GCE_ISSUE_CHOICES.choices,
        help_text="The issue the letter is reporting.",
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = LetterSenderIssueManager()

    class Meta:
        unique_together = ("letter", "value")
        ordering = ("value",)

    def __str__(self):
        if not self.pk:
            return super().__str__()
        return f"Issue: {self.value}"

    def clean(self):
        super().clean()
        ensure_issue_is_valid(self.value)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
