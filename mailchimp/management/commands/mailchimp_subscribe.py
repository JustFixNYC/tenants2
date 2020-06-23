from django.core.management import BaseCommand, CommandError

from mailchimp import mailchimp


class Command(BaseCommand):
    help = 'Subscribe an email address to MailChimp.'

    def add_arguments(self, parser):
        parser.add_argument('email')
        parser.add_argument(
            'language',
            choices=[v.value for v in mailchimp.Language],
        )
        parser.add_argument(
            'source',
            choices=[v.value for v in mailchimp.SubscribeSource],
        )

    def handle(self, *args, **options):
        if not mailchimp.is_enabled():
            raise CommandError("Mailchimp integration is disabled.")

        email: str = options['email']
        language = mailchimp.Language(options['language'])
        source = mailchimp.SubscribeSource(options['source'])

        mailchimp.subscribe(
            email=email,
            language=language,
            source=source,
        )

        print("Done.")
