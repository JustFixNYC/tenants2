from django.db import models

from texting.models import TWILIO_SID_LENGTH

# https://www.twilio.com/docs/glossary/what-e164
MAX_E164_LEN = 15


class Message(models.Model):
    sid = models.CharField(max_length=TWILIO_SID_LENGTH, primary_key=True)
    body = models.TextField()

    # Longest status is "partially_delivered" (19 characters)
    status = models.CharField(max_length=20)

    date_created = models.DateTimeField()
    date_sent = models.DateTimeField(null=True, blank=True)
    date_updated = models.DateTimeField()

    # Longest direction is "outbound-reply" (14 characters)
    direction = models.CharField(max_length=15)

    # Note that these numbers are in E.164 format, e.g. '+14155552671'.
    from_number = models.CharField(max_length=MAX_E164_LEN)
    to_number = models.CharField(max_length=MAX_E164_LEN)

    # No idea how long these will actually be but odds are they are pretty short.
    error_code = models.CharField(max_length=20, blank=True, null=True)

    error_message = models.TextField(blank=True, null=True)
