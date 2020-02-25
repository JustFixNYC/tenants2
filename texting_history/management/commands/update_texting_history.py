from typing import List
from django.core.management.base import BaseCommand
from django.conf import settings

from texting import twilio
from texting.twilio import tendigit_to_e164
from texting_history.models import Message


class Command(BaseCommand):
    help = "Update text message history from Twilio."

    def handle(self, *args, **options):
        client = twilio.get_client()
        Message.objects.all().delete()
        models: List[Message] = []
        our_number = tendigit_to_e164(settings.TWILIO_PHONE_NUMBER)
        for sms in client.messages.list(limit=10, to=our_number):
            model = Message(
                sid=sms.sid,
                direction=sms.direction,
                to_number=sms.to,
                from_number=sms.from_,
                body=sms.body,
                status=sms.status,
                date_created=sms.date_created,
                date_sent=sms.date_sent,
                date_updated=sms.date_updated,
                error_code=sms.error_code,
                error_message=sms.error_message,
            )
            print(
                sms.sid, sms.direction, sms.to, sms.from_, sms.body, sms.status, sms.date_created)
            model.clean_fields()
            models.append(model)
        Message.objects.bulk_create(models)
