from django.core.management.base import BaseCommand

from legacy_tenants.auth import try_password


class Command(BaseCommand):
    help = 'Try a legacy password.'

    def add_arguments(self, parser):
        parser.add_argument('phone_number')
        parser.add_argument('password')

    def handle(self, *args, **options):
        phone_number: str = options['phone_number']
        password: str = options['password']

        if try_password(phone_number, password):
            self.stdout.write("Password is correct!\n")
        else:
            self.stdout.write("Invalid password!\n")
