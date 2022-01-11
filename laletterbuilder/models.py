from django.db import models
from django.db.models.fields.related import ForeignKey
from users.models import JustfixUser
from project import common_data

LETTER_TYPE_CHOICES = common_data.Choices.from_file("la-letter-builder-letter-choices.json")
