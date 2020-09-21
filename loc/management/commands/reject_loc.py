from django.core.management.base import BaseCommand
from django.core.mail import send_mail

from users.models import JustfixUser
from loc.models import LOC_MAILING_CHOICES


EMAIL_SUBJECT = "Your recent Letter of Complaint"

EMAIL_SENDER = "JustFix.nyc Support <support@justfix.nyc>"

EMAIL_TEXT = """\
Hello %(first_name)s,

You are being contacted because you recently submitted
a Letter of Complaint at JustFix.nyc.  However, some of
the custom issues you reported are not related to
apartment repairs, and those are the only kinds of issues
that can be addressed when we mail your letter for you.

If you log in and remove those issues and re-send the
letter, we'll be happy to send it for you.

Regards,
JustFix.nyc
""".strip()


class Command(BaseCommand):
    help = 'Reject a LOC due to invalid custom issues.'

    def add_arguments(self, parser):
        parser.add_argument('username')

    def handle(self, *args, **options) -> None:
        username = options['username']
        user = JustfixUser.objects.get(username=username)
        letter_request = user.letter_request
        assert letter_request.mail_choice == LOC_MAILING_CHOICES.WE_WILL_MAIL, \
            "User must have asked us to send the letter"
        assert user.email, "User must have an email address"
        self.stdout.write(f"Sending email to {user.email}...\n")
        send_mail(
            subject=EMAIL_SUBJECT,
            message=EMAIL_TEXT % {
                'first_name': user.first_name,
            },
            from_email=EMAIL_SENDER,
            recipient_list=[user.email],
        )
        self.stdout.write("Deleting letter request...\n")
        letter_request.delete()
        print("Done.")
