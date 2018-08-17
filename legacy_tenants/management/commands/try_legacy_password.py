from django.core.management.base import BaseCommand

from legacy_tenants import auth, mongo


class Command(BaseCommand):
    help = 'Try a legacy password.'

    def add_arguments(self, parser):
        parser.add_argument('phone_number')
        parser.add_argument('password')

    def handle(self, *args, **options):
        phone_number: str = options['phone_number']
        password: str = options['password']
        user = mongo.get_user_by_phone_number(phone_number)

        if user and auth.try_password(user.identity, password):
            self.stdout.write("Password is correct!\n")
        else:
            self.stdout.write("Invalid password!\n")
