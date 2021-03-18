import datetime
from typing import Dict, Optional
from django.core.management.base import BaseCommand
from django.utils.timezone import make_aware, utc

from project.util.mailing_address import US_STATE_CHOICES
from onboarding.models import OnboardingInfo, BOROUGH_CHOICES


STRIP_SUFFIXES = [
    ", United States (via Mapbox)",
    ", New York, NY, USA (via NYC GeoSearch)",
]


NYC_COUNTY_BOROUGHS: Dict[str, str] = {
    "New York": BOROUGH_CHOICES.MANHATTAN,
    "Richmond": BOROUGH_CHOICES.STATEN_ISLAND,
    "Queens": BOROUGH_CHOICES.QUEENS,
    "Kings": BOROUGH_CHOICES.BROOKLYN,
    "Bronx": BOROUGH_CHOICES.BRONX,
}


def strip_suffix(addr: str) -> str:
    for suffix in STRIP_SUFFIXES:
        if addr.endswith(suffix):
            return addr[: -len(suffix)]
    return addr


def get_addr(info: OnboardingInfo) -> str:
    state_label = US_STATE_CHOICES.get_label(info.state)
    return f"{info.address}, {info.city}, {state_label} {info.zipcode}".strip()


def get_expected_geocoded_addr(info: OnboardingInfo) -> str:
    if info.non_nyc_city:
        return get_expected_geocoded_nationaladdr(info)
    return get_expected_geocoded_nycaddr(info)


def get_expected_geocoded_nationaladdr(info: OnboardingInfo) -> str:
    return get_addr(info)


def get_expected_geocoded_nycaddr(info: OnboardingInfo) -> str:
    borough_label = BOROUGH_CHOICES.get_label(info.borough)
    return f"{info.address}, {borough_label}"


def get_kind(info: OnboardingInfo) -> str:
    return "national" if info.non_nyc_city else "nyc"


class Command(BaseCommand):
    help = "Manually verify user addresses that have no geocoding metadata."

    def add_arguments(self, parser):
        parser.add_argument(
            "--since", help="only process users who logged in since YYYY-MM-DD (UTC)."
        )
        parser.add_argument(
            "--state", help="filter users by 2-letter state abbreviation (e.g. 'NY')."
        )

    def confirm(self) -> bool:
        result = input("Is the geocoded address correct [y/N]? ")
        if result in ["y", "Y"]:
            return True
        return False

    def print_with_label(self, label: str, value: str, label_width: int = 30):
        label = label.rjust(label_width)
        self.stdout.write(f"{label}: {value}")

    def convert_national_to_nyc_addr_if_needed(self, info: OnboardingInfo) -> bool:
        if not (info.geocoded_address and info.non_nyc_city and info.state == US_STATE_CHOICES.NY):
            return False

        county = info.lookup_county()
        assert county, f"geocoded NYC address '{info.geocoded_address}' should have a county!"

        if county in NYC_COUNTY_BOROUGHS:
            self.stdout.write(
                f"National address at '{info.geocoded_address}' appears to be in NYC."
            )
            info.borough = NYC_COUNTY_BOROUGHS[county]
            info.non_nyc_city = ""
            info.geocoded_address = ""
            assert info.maybe_lookup_new_addr_metadata()
            return True

        return False

    def verify(self, info: OnboardingInfo):
        assert not info.geocoded_address

        kind = get_kind(info)
        self.stdout.write(
            f"Verifying {kind} address for {info.user} (last login @ {info.user.last_login})."
        )
        self.stdout.write(f"User admin link: {info.user.admin_url}")

        assert (
            info.maybe_lookup_new_addr_metadata()
        ), "Looking up address metadata should be triggered when no geocoded address exists!"

        self.convert_national_to_nyc_addr_if_needed(info)
        addr = get_addr(info)

        if not info.geocoded_address:
            self.stdout.write(
                f"Unable to geocode address for '{addr}'. The geocoding service may be down "
                f"or no addresses matched."
            )
            return

        expected = get_expected_geocoded_addr(info)
        actual = strip_suffix(info.geocoded_address)
        actual_kind = get_kind(info)
        save = False

        if expected.lower() == actual.lower():
            self.stdout.write(f"Geocoded address '{actual}' exactly matches user address.")
            save = True
        else:
            self.print_with_label(f"User entered {kind} address", expected)
            self.print_with_label(f"Geocoded {actual_kind} address", actual)

            if self.confirm():
                save = True

        if save:
            self.stdout.write("Updating database.")
            info.save()

    def handle(self, *args, **options):
        since: Optional[str] = options["since"]
        state: Optional[str] = options["state"]
        filter_opts = dict(geocoded_address="")
        if since is not None:
            filter_opts["user__last_login__gte"] = make_aware(
                datetime.datetime.strptime(since, "%Y-%m-%d"), timezone=utc
            )
        if state is not None:
            US_STATE_CHOICES.validate_choices(state)
            filter_opts["state"] = state
        qs = (
            OnboardingInfo.objects.select_related("user")
            .filter(**filter_opts)
            .order_by("-user__last_login")
        )
        self.stdout.write(f"{qs.count()} user(s) found.")
        for info in qs:
            try:
                self.verify(info)
            except KeyboardInterrupt:
                self.stdout.write("\nReceived SIGINT, exiting.")
                return
