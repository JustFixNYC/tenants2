from django.conf import settings
from django.core.mail import send_mail


def send_email_to_dhcr(subject: str, body: str):
    send_mail(
        subject,
        body,
        settings.DHCR_EMAIL_SENDER_ADDRESS,
        settings.DHCR_EMAIL_RECIPIENT_ADDRESSES,
        fail_silently=False,
    )
