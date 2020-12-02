from django.core.management.base import BaseCommand
from project import justfix_environment


class Command(BaseCommand):
    help = "Display a list of supported environment variables."

    def handle(self, *args, **options):
        self.stdout.write("Supported environment variables:\n\n")
        justfix_environment.get().print_help(self.stdout)
