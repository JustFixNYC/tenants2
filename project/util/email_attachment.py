from typing import List
from django.http import FileResponse
from django.core.mail import EmailMessage


def email_file_response_as_attachment(
    subject: str,
    body: str,
    recipients: List[str],
    attachment: FileResponse
) -> None:
    attachment_bytes = attachment.getvalue()

    for recipient in recipients:
        msg = EmailMessage(subject=subject, body=body, to=[recipient])
        msg.attach(attachment.filename, attachment_bytes)
        msg.send()
