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
        norentSite = site_util.get_site_of_type(site_util.SITE_CHOICES.NORENT)
        norentUrl = site_util.absolutify_url("/", site=norentSite)
        housingIsKeySite = site_util.get_site_of_type(site_util.SITE_CHOICES.HOUSINGISKEY)
        housingIsKeyUrl = site_util.absolutify_url("/", site=housingIsKeySite)
        if self.year_and_month == "2021-02":
            msg = _(
                "%(first_name)s, you've previously created an account on NoRent.org. "
                "The California Tenant Relief Act of 2020 was extended by the new law SB91. "
                "In order to be protected from eviction, you must send a new declaration "
                "letter to your landlord through NoRent.org: %(norentUrl)s"
            )
        elif self.year_and_month == "2021-07":
            msg = _(
                "%(first_name)s, you've previously created an account on NoRent.org. "
                "The California Tenant Relief Act of 2020 was extended by the new law AB832. "
                "In order to be protected from eviction, you must send a new declaration "
                "letter to your landlord through NoRent.org: %(norentUrl)s"
            )
        elif self.year_and_month == "2021-10":
            msg = _(
                "This is NoRent, texting from a new number. You’ve previously created an account "
                "on NoRent.org. On Friday, Oct 1, 2021, California’s statewide protections "
                "for tenants unable to pay rent due to COVID-19 (AB832) expired. If "
                "you have not submitted a declaration for a month you were unable to pay rent, "
                "do so now through NoRent.org: %(norentUrl)s. We also strongly encourage you to "
                "apply for government rental assistance through Housing is Key: "
                "%(housingIsKeyUrl)s or call 833-430-2122."
            )
        else:
            msg = _(
                "%(first_name)s, you've previously created an account on NoRent.org. "
                "If you are unable to pay rent next month AND you have a COVID-19 "
                "related reason for not paying, we recommend that on or before your "
                "rent due date or within 7 days of your rent due date, you send a "
                "new AB832 declaration to your landlord through NoRent.org: %(norentUrl)s"
            )

        params = {
            "first_name": user.best_first_name,
            "norentUrl": norentUrl,
            "housingIsKeyUrl": housingIsKeyUrl,
        }

        return msg % params


SmsReminder.validate(NorentReminder("2021-10"))
