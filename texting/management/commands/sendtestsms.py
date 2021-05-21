from django.core.management.base import BaseCommand

from texting import twilio


class Command(BaseCommand):
    help = "Send a test SMS message."

    def add_arguments(self, parser):
        parser.add_argument("phone_number")
        parser.add_argument("body")

    def handle(self, *args, **options):
        phone_number: str = options["phone_number"]
        body: str = options["body"]

        result = twilio.send_sms(phone_number, body)

        print(f"Result: {result}")
