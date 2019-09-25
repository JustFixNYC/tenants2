from django.core.mail import send_mail
from project import common_data

RH_EMAIL_TEXT = common_data.load_json("rh.json")

DHCR_EMAIL_SENDER_ADDRESS = 'support@justfix.nyc'

DHCR_EMAIL_RECIPIENT_ADDRESSES = ['rentinfo@nyyshcr.org', 'e8x9f4k1h2i3e6p3@justfixnyc.slack.com']


def send_email_to_dhcr(first_name, last_name, address, apartment_number):
    full_name = first_name + ' ' + last_name
    new_line = "%0A"
    send_mail(
        RH_EMAIL_TEXT['DHCR_EMAIL_SUBJECT'],

        RH_EMAIL_TEXT['DHCR_EMAIL_BODY_PART_1'] + full_name +
        RH_EMAIL_TEXT['DHCR_EMAIL_BODY_PART_2'] + address +
        RH_EMAIL_TEXT['DHCR_EMAIL_BODY_PART_3'] + apartment_number +
        RH_EMAIL_TEXT['DHCR_EMAIL_BODY_PART_4'] + new_line + new_line +

        RH_EMAIL_TEXT['DHCR_EMAIL_SIGNATURE'] + new_line + full_name,

        DHCR_EMAIL_SENDER_ADDRESS,

        DHCR_EMAIL_RECIPIENT_ADDRESSES,

        fail_silently=False,
    )
