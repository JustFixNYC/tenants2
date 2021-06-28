from django.core.management import BaseCommand

from norent.sms_reminders import NorentReminder


class Command(BaseCommand):
    help = "Send NoRent California reminders for the given year and month."

    def add_arguments(self, parser):
        parser.add_argument("YYYY-MM")
        parser.add_argument("--dry-run", help="don't actually send messages.", action="store_true")
        parser.add_argument(
            "--seconds-between-texts",
            help=(
                "Wait the given number of seconds between each text message, "
                "so we don't overload Twilio's SMS queue."
            ),
            type=float,
            default=0.0,
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        year_and_month: str = options["YYYY-MM"]
        seconds: float = options["seconds_between_texts"]

        print(f"Sending NoRent reminders for {year_and_month}.")
        NorentReminder(year_and_month, dry_run=dry_run).remind_users(seconds_between_texts=seconds)
        print("Done.")
