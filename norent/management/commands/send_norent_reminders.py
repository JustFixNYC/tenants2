from django.core.management import BaseCommand
from django.utils import translation
from django.utils.translation import gettext as _

from users.models import JustfixUser
from norent.models import RentPeriod
from project.util import site_util


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
    def handle(self, *args, **options):
        rp = RentPeriod.objects.get_by_iso_date("2020-11-01")
        users = JustfixUser.objects.filter(
            onboarding_info__state="CA",
            onboarding_info__can_we_sms=True,
        ).exclude(
            norent_letters__rent_periods=rp
        )
        # TODO: Exclude users for whom we've already sent the reminder.
        print(f"Sending reminders about {rp}.")
        for user in users:
            with translation.override(user.locale):
                user.send_sms(render_sms(first_name=user.first_name))
                # TODO: If the return value (a sid) is non-empty, remember
                # that we sent the reminder!
