from project import common_data
from project.util.lob_models_util import LocalizedHTMLLetter
from users.models import JustfixUser
from django.db import models


LETTER_TYPE_CHOICES = common_data.Choices.from_file("la-letter-builder-letter-choices.json")


class Letter(LocalizedHTMLLetter):
    """
    A LA Letter Builder letter that's ready to be sent, or has already been sent.
    It has at least x information
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
