from io import StringIO
from pathlib import Path
from email.mime.base import MIMEBase
from django.core.mail import send_mail, EmailMessage
import pytest
import freezegun

from project.util.testing_util import Snapshot
from project.util.friendly_email_console_backend import EmailBackend


MY_DIR = Path(__file__).parent.resolve()

SNAPSHOT_DIR = MY_DIR / "test_friendly_email_console_backend_snapshots"


class MyBackend(EmailBackend):
    latest_output = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, stream=StringIO())

    def write_message(self, message):
        super().write_message(message)
        MyBackend.latest_output = "\n".join(
            [
                line
                for line in self.stream.getvalue().splitlines()
                if not line.startswith("Message-ID: ")
            ]
        )

    @classmethod
    def snapshot(cls, filename):
        return Snapshot(cls.latest_output, SNAPSHOT_DIR / filename)


@pytest.fixture
def backend(settings):
    with freezegun.freeze_time("2020-01-01"):
        MyBackend.latest_output = ""
        settings.EMAIL_BACKEND = f"{__name__}.MyBackend"
        yield MyBackend


BASE_EMAIL_MESSAGE_KWARGS = dict(
    subject="here is a subject",
    body="here is a message",
    to=["landlordo@calrissian.net"],
)

BASE_SEND_MAIL_KWARGS = dict(
    subject="here is a subject",
    message="here is a message",
    from_email="boop@jones.com",
    recipient_list=["landlordo@calrissian.net"],
)


def test_no_extra_info(backend):
    send_mail(**BASE_SEND_MAIL_KWARGS)
    snapshot = backend.snapshot("no_extra_info.txt")
    assert snapshot.expected == snapshot.actual


def test_html_alternative(backend):
    send_mail(**BASE_SEND_MAIL_KWARGS, html_message="<p>hi</p>")
    snapshot = backend.snapshot("html_alternative.txt")
    assert snapshot.expected == snapshot.actual


def test_attachments(backend):
    msg = EmailMessage(**BASE_EMAIL_MESSAGE_KWARGS)
    msg.attach("blarf.pdf", b"blarrrrf")
    msg.attach(MIMEBase("image", "png"))
    msg.send()
    snapshot = backend.snapshot("attachments.txt")
    assert snapshot.expected == snapshot.actual
