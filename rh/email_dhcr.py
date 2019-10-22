from django.conf import settings
from django.core.mail import send_mail

from project import common_data

RH_EMAIL_TEXT = common_data.load_json("rh.json")


def send_email_to_dhcr(first_name, last_name, address, borough, apartment_number):
    full_name = first_name + ' ' + last_name
    full_address = address + ', ' + borough
    new_line = "\n"
    send_mail(
        RH_EMAIL_TEXT['DHCR_EMAIL_SUBJECT'],

        RH_EMAIL_TEXT['DHCR_EMAIL_BODY']
        .replace('FULL_NAME', full_name)
        .replace('FULL_ADDRESS', full_address)
        .replace('APARTMENT_NUMBER', apartment_number) +
        new_line +
        new_line +
        RH_EMAIL_TEXT['DHCR_EMAIL_SIGNATURE'] + new_line + full_name,

        settings.DHCR_EMAIL_SENDER_ADDRESS,

        settings.DHCR_EMAIL_RECIPIENT_ADDRESSES,

        fail_silently=False,
    )
