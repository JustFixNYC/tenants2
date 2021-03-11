import datetime
from typing import Optional
from django.core.management.base import BaseCommand
from django.utils.timezone import make_aware, utc

from project.util.mailing_address import US_STATE_CHOICES
from onboarding.models import OnboardingInfo, BOROUGH_CHOICES


STRIP_SUFFIXES = [
    ", United States (via Mapbox)",
    ", New York, NY, USA (via NYC GeoSearch)",
]


def strip_suffix(addr: str) -> str:
    for suffix in STRIP_SUFFIXES:
        if addr.endswith(suffix):
            return addr[: -len(suffix)]
    return addr


class Command(BaseCommand):
    help = "Manually verify user addresses that have no geocoding metadata."

    def add_arguments(self, parser):
        parser.add_argument(
            "--since", help="only process users who logged in since YYYY-MM-DD (UTC)."
        )

    def confirm(self) -> bool:
        result = input("Is the geocoded address correct [y/N]? ")
        if result in ["y", "Y"]:
            return True
        return False

    def get_addr(self, info) -> str:
        state_label = US_STATE_CHOICES.get_label(info.state)
        return f"{info.address}, {info.city}, {state_label} {info.zipcode}".strip()

    def get_expected_geocoded_nationaladdr(self, info) -> str:
        return self.get_addr(info)

    def get_expected_geocoded_nycaddr(self, info):
        borough_label = BOROUGH_CHOICES.get_label(info.borough)
        return f"{info.address}, {borough_label}"

    def verify(self, info):
        assert not info.geocoded_address

        kind = "national" if info.non_nyc_city else "nyc"
        self.stdout.write(
            f"Verifying {kind} address for {info.user} (last login @ {info.user.last_login})."
        )
        self.stdout.write(f"User admin link: {info.user.admin_url}")
        addr = self.get_addr(info)

        assert (
            info.maybe_lookup_new_addr_metadata()
        ), "Looking up address metadata should be triggered when no geocoded address exists!"

        if not info.geocoded_address:
            self.stdout.write(
                f"Unable to geocode address for '{addr}'. The geocoding service may be down "
                f"or no addresses matched."
            )
            return

        if info.non_nyc_city:
            expected = self.get_expected_geocoded_nationaladdr(info)
        else:
            expected = self.get_expected_geocoded_nycaddr(info)

        expected = strip_suffix(expected)
        actual = strip_suffix(info.geocoded_address)
        save = False

        if expected.lower() == actual.lower():
            self.stdout.write(f"Geocoded address '{actual}' exactly matches user address.")
            save = True
        else:
            self.stdout.write(f"User entered address: {expected}")
            self.stdout.write(f"    Geocoded address: {actual}")

            if self.confirm():
                save = True

        if save:
            self.stdout.write("Updating database.")
            info.save()

    def handle(self, *args, **options):
        since: Optional[str] = options["since"]
        filter_opts = dict(geocoded_address="")
        if since is not None:
            filter_opts["user__last_login__gte"] = make_aware(
                datetime.datetime.strptime(since, "%Y-%m-%d"), timezone=utc
            )
        qs = (
            OnboardingInfo.objects.select_related("user")
            .filter(**filter_opts)
            .order_by("-user__last_login")
        )
        for info in qs:
            try:
                self.verify(info)
            except KeyboardInterrupt:
                self.stdout.write("\nReceived SIGINT, exiting.")
                return
