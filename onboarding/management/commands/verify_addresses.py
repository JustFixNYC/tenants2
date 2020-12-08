from typing import Optional, Tuple
from django.core.management.base import BaseCommand
from django import forms

from project.util.address_form_fields import verify_address
from onboarding.models import OnboardingInfo


class Command(BaseCommand):
    help = "Manually verify user addresses that are currently unverified."

    def get_verified_address(self, address: str, borough: str) -> Optional[Tuple[str, str]]:
        try:
            vinfo = verify_address(address, borough)
        except forms.ValidationError:
            self.stdout.write("Geocoding failed; the address appears to be invalid.")
            return None
        if vinfo.is_verified is False:
            self.stdout.write("Unable to verify address, the geocoding service may be down.")
            return None
        return (vinfo.address, vinfo.borough)

    def confirm(self) -> bool:
        result = input("Is the geocoded address correct [y/N]? ")
        if result in ["y", "Y"]:
            return True
        return False

    def verify(self, info):
        self.stdout.write(f"Verifying address for {info.user}.")
        verified = self.get_verified_address(info.address, info.borough)
        if verified is None:
            return

        address, borough = verified
        self.stdout.write(f"User entered the address: {info.address}, {info.borough}")
        self.stdout.write(f"     Geocoded address is: {address}, {borough}")

        if self.confirm():
            info.address = address
            info.borough = borough
            info.address_verified = True
            info.save()
            self.stdout.write("Updating database.")

    def handle(self, *args, **options):
        for info in OnboardingInfo.objects.filter(address_verified=False):
            self.verify(info)
