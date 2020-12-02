import factory
import pytz
import datetime

from ..models import Message


some_date = datetime.datetime(2020, 3, 2, 18, 8, 48, 890982, tzinfo=pytz.timezone("utc"))


class MessageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Message

    sid = "SMded05904ccb347238880ca9264e8fe1c"

    ordering = 0.0

    body = "testing"

    status = "sent"

    date_created = some_date

    date_sent = some_date

    date_updated = some_date

    direction = "inbound"

    user_phone_number = "+15551234567"

    is_from_us = False

    error_code = None

    error_message = None
