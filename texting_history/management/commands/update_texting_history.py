from typing import Optional, Tuple, Iterator
from django.core.management.base import BaseCommand
from django.db.models import Max, Min
import datetime
import itertools
from twilio.rest.api.v2010.account.message import MessageInstance
from django.utils.timezone import now
from django.conf import settings

from dwh.util import BatchWriter
from texting.management.commands.syncphonenumberlookups import verify_twilio_is_enabled
from texting import twilio
from texting.twilio import tendigit_to_e164
from texting_history.models import Message

MessageIterator = Iterator[MessageInstance]


def get_min_max_date_sent(queryset) -> Tuple[Optional[datetime.datetime],
                                             Optional[datetime.datetime]]:
    result = queryset.aggregate(Min('date_sent'), Max('date_sent'))
    return (result['date_sent__min'], result['date_sent__max'])


def stop_when_older_than(msgs: MessageIterator, when: datetime.datetime) -> MessageIterator:
    # This relies on the fact that Twilio's REST API always returns messages in
    # reverse chronological order.
    for msg in msgs:
        if msg.date_sent < when:
            break
        yield msg


def get_ordering_for_sms(sms, is_from_us: bool) -> float:
    ordering = sms.date_sent.timestamp()
    if is_from_us:
        # `date_sent` only has second-precision and our automated replies are often sent
        # during the same second that Twilio made the HTTP request to us for incoming
        # messages (which is how the `date_sent` field is defined). So we're going
        # to increment the ordering if this message is from us, to indicate that it
        # most likely was sent less than a second after the user's last reply.
        ordering += 0.1
    return ordering


def clean_body(body: str) -> str:
    '''
    Clean the given string so it can be passed into Postgres.

    For example, Django's Postgres backend will raise a "A string literal
    cannot contain NUL (0x00) characters" error if a string ever
    contains such characters, so this function strips them out:

        >>> clean_body('please email link \\x00 boop\\x00msn.com')
        'please email link \uFFFD boop\uFFFDmsn.com'
    '''

    return body.replace("\x00", "\uFFFD")


def update_texting_history(
    backfill: bool = False,
    max_age: Optional[int] = None,
    silent: bool = False,
) -> Optional[datetime.datetime]:
    if not twilio.is_enabled():
        return None
    max_age = max_age or 99_999
    client = twilio.get_client()
    our_number = tendigit_to_e164(settings.TWILIO_PHONE_NUMBER)
    earliest_from_us, latest_from_us = get_min_max_date_sent(Message.objects.filter(
        is_from_us=True, our_phone_number=our_number))
    earliest_to_us, latest_to_us = get_min_max_date_sent(Message.objects.filter(
        is_from_us=False, our_phone_number=our_number))
    max_age_date = now() - datetime.timedelta(days=max_age)

    # The way Twilio's Python client retrieves messages is a bit confusing at first,
    # but the documentation on their underlying REST API helps a bit:
    #
    #   https://www.twilio.com/docs/sms/api/message-resource
    #
    # In short, it's not possible to provide *both* a maximum and a minimum date,
    # and the results are always sorted in reverse chronological order, so we need
    # to deal with that.

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

    with BatchWriter(Message, ignore_conflicts=True, silent=silent) as writer:
        for sms in all_messages:
            is_from_us = sms.from_ == our_number
            model = Message(
                sid=sms.sid,
                ordering=get_ordering_for_sms(sms, is_from_us),
                direction=sms.direction,
                is_from_us=is_from_us,
                user_phone_number=sms.to if is_from_us else sms.from_,
                body=clean_body(sms.body),
                status=sms.status,
                date_created=sms.date_created,
                date_sent=sms.date_sent,
                date_updated=sms.date_updated,
                error_code=sms.error_code,
                error_message=sms.error_message,
                our_phone_number=our_number,
            )
            if not silent:
                print(sms.sid, sms.date_sent, sms.direction, sms.status)
            model.clean_fields()
            writer.write(model)

    return Message.objects.all().aggregate(Max('date_sent'))['date_sent__max']


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
        verify_twilio_is_enabled()
        latest = update_texting_history(
            backfill=options['backfill'],
            max_age=options['max_age']
        )
        print(f"Done, latest text message is {latest}.")
