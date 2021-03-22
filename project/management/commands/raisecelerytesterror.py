from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from project.tasks import raise_test_error


class Command(BaseCommand):
    help = "Raise a test error to make sure error reporting works in Celery tasks."

    def add_arguments(self, parser):
        parser.add_argument("id")

    def handle(self, *args, **options):
        if not settings.CELERY_BROKER_URL:
            raise CommandError("Celery integration is disabled!")
        id = options["id"]
        self.stdout.write(f"Queuing task {raise_test_error.name}({repr(id)}).\n")
        raise_test_error.delay(id)
        self.stdout.write("Done.\n")
