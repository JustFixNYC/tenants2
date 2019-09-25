from django.core.mail import send_mail


def send_email_to_dhcr(first_name, last_name, address, apt_number):
    send_mail(
        'Subject here',
        'Here is the message.',
        'from@example.com',
        ['to@example.com'],
        fail_silently=False,
    )
