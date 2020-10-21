from django.core.management import BaseCommand
from django.utils import translation
from django.utils import timezone
from django.utils.translation import gettext as _

from users.models import JustfixUser
from norent.models import RentPeriod
from project.util import site_util
from texting.models import REMINDERS, Reminder, exclude_users_with_invalid_phone_numbers


def render_sms(first_name: str) -> str:
    site = site_util.get_site_of_type(site_util.SITE_CHOICES.NORENT)
    url = site_util.absolutify_url("/", site=site)
    return _(
        "%(first_name)s, you've previously created an account on NoRent.org. "
        "If you are unable to pay rent next month AND you have a COVID-19 "
        "related reason for not paying, we recommend that on or before your "
        "rent due date or within 7 days of your rent due date, you send a "
        "new AB3088 declaration to your landlord through NoRent.org: %(url)s"
    ) % {
        'first_name': first_name,
        'url': url,
    }


class Command(BaseCommand):
    help = "Send NoRent California reminders for the given year and month."

    def add_arguments(self, parser):
        parser.add_argument('YYYY-MM')

    def handle(self, *args, **options):
        year_and_month = options['YYYY-MM']
        reminder_kind = 'NORENT_CA_' + year_and_month.replace('-', '_')
        rp = RentPeriod.objects.get_by_iso_date(f"{year_and_month}-01")
        REMINDERS.validate_choices(reminder_kind)

        users = JustfixUser.objects.filter(
            onboarding_info__state="CA",
            onboarding_info__can_we_sms=True,
        ).exclude(
            norent_letters__rent_periods=rp
        ).exclude(
            reminders__kind=reminder_kind
        )
        users = exclude_users_with_invalid_phone_numbers(users)
        print(f"Sending reminders about {rp}.")
        for user in users:
            with translation.override(user.locale):
                sid = user.send_sms(render_sms(first_name=user.first_name))
                if sid:
                    Reminder(
                        kind=reminder_kind,
                        sent_at=timezone.now(),
                        user=user,
                        sid=sid,
                    ).save()
