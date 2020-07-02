from typing import List
import math
from email.mime.base import MIMEBase
from django.core.mail.message import EmailMultiAlternatives, EmailMessage
from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend


def get_kb(content) -> int:
    return math.ceil(len(content) / 1024)


def log_extra_email_content(message: EmailMessage, extra_content: List[str]):
    for attachment in message.attachments:
        extra = ""
        if isinstance(attachment, MIMEBase):
            mimetype = attachment['Content-Type']
            content = attachment.as_bytes()
        else:
            filename, content, mimetype = attachment
            extra = f" '{filename}'"
        kb = get_kb(content)
        extra_content.append(f"A {kb}k {mimetype} attachment{extra}.")


def log_extra_alternatives(message: EmailMultiAlternatives, extra_content: List[str]):
    for content, mimetype in message.alternatives:
        kb = get_kb(content)
        extra_content.append(f"A {kb}k {mimetype} alternative.")


class EmailBackend(ConsoleEmailBackend):
    '''
    A friendly console backend that doesn't spam the console with
    unnecessary information such as encoded attachment data or verbose HTML.
    '''

    def __log_extra_content(self, extra_content: List[str]):
        if extra_content:
            self.stream.write(
                "The following email has extra information that is not displayed "
                "for conciseness:\n"
            )
            for line in extra_content:
                self.stream.write(f"  * {line}\n")
            self.stream.write("\n")

    def write_message(self, message):
        extra_content: List[str] = []

        if isinstance(message, EmailMessage):
            log_extra_email_content(message, extra_content)
            if isinstance(message, EmailMultiAlternatives):
                log_extra_alternatives(message, extra_content)
            message = EmailMessage(
                subject=message.subject,
                body=message.body,
                from_email=message.from_email,
                to=message.to,
                bcc=message.bcc,
                connection=message.connection,
                attachments=None,
                headers=message.extra_headers,
                cc=message.cc,
                reply_to=message.reply_to,
            )

        self.__log_extra_content(extra_content)
        super().write_message(message)
