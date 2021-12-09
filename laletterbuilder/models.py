from project.util.lob_models_util import MailItem
from users.models import JustfixUser
from django.db import models


class LALetter(MailItem):
    """
    A LA letter that is ready to send or has already been sent.
    This is an abstract class to house common information between all LA Letters.
    """

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE, related_name="la_letters")

    letter_sent_at = models.DateTimeField(
        null=True, blank=True, help_text="When the letter was mailed."
    )

    letter_emailed_at = models.DateTimeField(
        null=True, blank=True, help_text="When the letter was e-mailed."
    )


class HabitabilityRepairsLetter(LALetter):
    pass
