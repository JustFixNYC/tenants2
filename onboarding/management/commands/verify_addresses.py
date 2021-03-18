import datetime
from typing import Any, Dict, Optional
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


def parse_since(value: str) -> datetime.datetime:
    if value.endswith("d"):
        days = datetime.timedelta(days=int(value[:-1]))
        return datetime.datetime.now(utc) - days

    return make_aware(datetime.datetime.strptime(value, "%Y-%m-%d"), timezone=utc)


class Command(BaseCommand):
    help = "Manually verify user addresses that have no geocoding metadata."

    interactive: bool = True
    verbosity: int = 1

    def add_arguments(self, parser):
        parser.add_argument(
            "--since",
            help=(
                "only process users who logged in since YYYY-MM-DD (UTC), or, "
                "when the argument is e.g. '5d', the given number of days in the past."
            ),
        )
        parser.add_argument(
            "--state", help="filter users by 2-letter state abbreviation (e.g. 'NY')."
        )
        parser.add_argument(
            "--noinput",
            "--no-input",
            action="store_false",
            dest="interactive",
            help=(
                "Tells Django to NOT prompt the user for input of any kind. "
                "If the user ever needs to be prompted for confirmation, the "
                "default response will be to *not* confirm the action in "
                "question."
            ),
        )

    def confirm(self) -> bool:
        if self.interactive:
            result = input("Is the geocoded address correct [y/N]? ")
            if result in ["y", "Y"]:
                return True
        else:
            self.log("Command is running non-interactively, skipping this address.")
        return False

    def print_with_label(self, label: str, value: str, label_width: int = 30):
        label = label.rjust(label_width)
        self.log(f"{label}: {value}")

    def convert_national_to_nyc_addr_if_needed(self, info: OnboardingInfo) -> bool:
        if not (info.geocoded_address and info.non_nyc_city and info.state == US_STATE_CHOICES.NY):
            return False

        county = info.lookup_county()
        assert county, f"geocoded NYC address '{info.geocoded_address}' should have a county!"

        if county in NYC_COUNTY_BOROUGHS:
            self.log(f"National address at '{info.geocoded_address}' appears to be in NYC.")
            info.borough = NYC_COUNTY_BOROUGHS[county]
            info.non_nyc_city = ""
            info.geocoded_address = ""
            assert info.maybe_lookup_new_addr_metadata()
            return True

        return False

    def log(self, msg: str):
        if self.verbosity > 0:
            self.stdout.write(msg)

    def verify(self, info: OnboardingInfo) -> int:
        assert not info.geocoded_address

        kind = get_kind(info)
        self.log(f"Verifying {kind} address for {info.user} (last login @ {info.user.last_login}).")
        self.log(f"User admin link: {info.user.admin_url}")

        assert (
            info.maybe_lookup_new_addr_metadata()
        ), "Looking up address metadata should be triggered when no geocoded address exists!"

        self.convert_national_to_nyc_addr_if_needed(info)
        addr = get_addr(info)

        if not info.geocoded_address:
            self.log(
                f"Unable to geocode address for '{addr}'. The geocoding service may be down "
                f"or no addresses matched."
            )
            return 0

        expected = get_expected_geocoded_addr(info)
        actual = strip_suffix(info.geocoded_address)
        actual_kind = get_kind(info)
        save = False

        if expected.lower() == actual.lower():
            self.log(f"Geocoded address '{actual}' exactly matches user address.")
            save = True
        else:
            self.print_with_label(f"User entered {kind} address", expected)
            self.print_with_label(f"Geocoded {actual_kind} address", actual)

            if self.confirm():
                save = True

        if save:
            self.log("Updating database.")
            info.save()
            return 1

        return 0

    def handle(self, *args, **options):
        self.interactive = options["interactive"]
        self.verbosity = options["verbosity"]
        since: Optional[str] = options["since"]
        state: Optional[str] = options["state"]
        filter_opts: Dict[str, Any] = dict(geocoded_address="")
        if since is not None:
            filter_opts["user__last_login__gte"] = parse_since(since)
        if state is not None:
            US_STATE_CHOICES.validate_choices(state)
            filter_opts["state"] = state
        qs = (
            OnboardingInfo.objects.select_related("user")
            .filter(**filter_opts)
            .order_by("-user__last_login")
        )
        self.stdout.write(f"{qs.count()} user(s) found.")
        total_updates = 0
        for info in qs:
            try:
                total_updates += self.verify(info)
            except KeyboardInterrupt:
                self.stdout.write("\nReceived SIGINT, exiting.")
                return
        self.stdout.write(f"{total_updates} user(s) updated.")
