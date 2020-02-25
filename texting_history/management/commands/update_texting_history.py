from typing import Optional, Tuple, Iterator
from django.core.management.base import BaseCommand
from django.db.models import Max, Min
import datetime
import itertools
from twilio.rest.api.v2010.account.message import MessageInstance
from django.utils.timezone import now
from django.conf import settings

from dwh.util import BatchWriter
from texting import twilio
from texting.twilio import tendigit_to_e164
from texting_history.models import Message

MessageIterator = Iterator[MessageInstance]


def get_min_max_date_sent(queryset) -> Tuple[Optional[datetime.datetime],
                                             Optional[datetime.datetime]]:
    result = queryset.aggregate(Min('date_sent'), Max('date_sent'))
    return (result['date_sent__min'], result['date_sent__max'])


def stop_when_older_than(msgs: MessageIterator, when: datetime.datetime) -> MessageIterator:
    for msg in msgs:
        if msg.date_sent < when:
            break
        yield msg


class Command(BaseCommand):
    help = "Update text message history from Twilio."

    def add_arguments(self, parser):
        parser.add_argument(
            '--max-age', type=int, help='Maximum age of messages, in days'
        )
        parser.add_argument(
            '--backfill', action='store_true',
            help='Backfill message history instead of retrieving latest messages.'
        )

    def handle(self, *args, **options):
        max_age: int = options['max_age'] or 99_999
        backfill: bool = options['backfill']
        client = twilio.get_client()
        our_number = tendigit_to_e164(settings.TWILIO_PHONE_NUMBER)
        earliest_from_us, latest_from_us = get_min_max_date_sent(Message.objects.filter(
            from_number=our_number))
        earliest_to_us, latest_to_us = get_min_max_date_sent(Message.objects.filter(
            to_number=our_number))
        max_age_date = now() - datetime.timedelta(days=max_age)
        if backfill:
            to_us_kwargs = {'date_sent_before': earliest_to_us}
            from_us_kwargs = {'date_sent_before': earliest_from_us}
        else:
            to_us_kwargs = {'date_sent_after': latest_to_us}
            from_us_kwargs = {'date_sent_after': latest_from_us}
        all_messages = itertools.chain(
            stop_when_older_than(
                client.messages.stream(to=our_number, **to_us_kwargs),
                max_age_date,
            ),
            stop_when_older_than(
                client.messages.stream(from_=our_number, **from_us_kwargs),
                max_age_date,
            )
        )
        with BatchWriter(Message, ignore_conflicts=True) as writer:
            for sms in all_messages:
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
                print(sms.sid, sms.date_sent, sms.direction, sms.status)
                model.clean_fields()
                writer.write(model)
