from django.utils.translation import gettext as _

from project.util import site_util
from texting.sms_reminder import SmsReminder
from norent.models import RentPeriod


class NorentReminder(SmsReminder):
    def __init__(self, year_and_month: str, dry_run: bool = False):
        super().__init__(dry_run=dry_run)
        self.year_and_month = year_and_month
        self.reminder_kind = "NORENT_CA_" + year_and_month.replace("-", "_")

    def filter_user_queryset(self, qs):
        rp = RentPeriod.objects.get_by_iso_date(f"{self.year_and_month}-01")
        return qs.filter(
            onboarding_info__state="CA",
        ).exclude(norent_letters__rent_periods=rp)

    def get_sms_text(self, user):
        site = site_util.get_site_of_type(site_util.SITE_CHOICES.NORENT)
        url = site_util.absolutify_url("/", site=site)
        return _(
            "%(first_name)s, you've previously created an account on NoRent.org. "
            "If you are unable to pay rent next month AND you have a COVID-19 "
            "related reason for not paying, we recommend that on or before your "
            "rent due date or within 7 days of your rent due date, you send a "
            "new AB3088 declaration to your landlord through NoRent.org: %(url)s"
        ) % {
            "first_name": user.first_name,
            "url": url,
        }


SmsReminder.validate(NorentReminder("2020-11"))
