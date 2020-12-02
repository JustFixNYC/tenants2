from django.db import models

from texting.models import TWILIO_SID_LENGTH

# https://www.twilio.com/docs/glossary/what-e164
MAX_E164_LEN = 15


class Message(models.Model):
    # Note that most of these fields are taken directly from the Twilio Message
    # resource, defined in https://www.twilio.com/docs/sms/api/message-resource.

    sid = models.CharField(max_length=TWILIO_SID_LENGTH, primary_key=True)

    # This allows us to easily order the text messages chronologically, without
    # having to deal with the fact that `date_sent` only has second-precision
    # and our automated replies are often sent during the same second that
    # Twilio made the HTTP request to us for incoming messages (which is how the
    # `date_sent` field is defined).
    ordering = models.FloatField()

    # Bizzarely, in practice, it is possible for this field to be blank.
    body = models.TextField(blank=True)

    # Longest status is "partially_delivered" (19 characters)
    status = models.CharField(max_length=20)

    date_created = models.DateTimeField()

    # I thought this might be null if the message wasn't actually sent
    # successfully, but this isn't actually the case; it is indeed *always*
    # defined.
    date_sent = models.DateTimeField()

    date_updated = models.DateTimeField()

    # Longest direction is "outbound-reply" (14 characters)
    direction = models.CharField(max_length=15)

    # Note that this number is in E.164 format, e.g. '+14155552671'.
    user_phone_number = models.CharField(max_length=MAX_E164_LEN)

    is_from_us = models.BooleanField()

    # The Twilio python docs claim this is unicode but it's actually
    # an integer.
    error_code = models.IntegerField(blank=True, null=True)

    error_message = models.TextField(blank=True, null=True)

    # Note that this number is in E.164 format, e.g. '+14155552671'.
    # We didn't originally store this information, but then we
    # discovered that we actually sent messages from more than
    # one number for a period of time.
    our_phone_number = models.CharField(max_length=MAX_E164_LEN)

    class Meta:
        indexes = [
            models.Index(fields=["user_phone_number"]),
            models.Index(fields=["user_phone_number", "ordering"]),
            models.Index(fields=["date_sent"]),
            models.Index(fields=["our_phone_number"]),
        ]
