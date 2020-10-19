from io import BytesIO
from django.http import FileResponse

from users.models import JustfixUser
from project.util.email_attachment import (
    get_slack_notify_text,
    email_file_response_as_attachment,
)


class TestGetSlackNotifyText:
    def test_it_works_with_one_recipient(self, db):
        user = JustfixUser(first_name="Boop", pk=1)
        assert get_slack_notify_text(user, "a peanut", 1) == (
            "<https://example.com/admin/users/justfixuser/1/change/|Boop> emailed "
            "a peanut to 1 recipient!"
        )

    def test_it_works_with_many_recipients(self, db):
        user = JustfixUser(first_name="Boop", pk=1)
        assert get_slack_notify_text(user, "a peanut", 3) == (
            "<https://example.com/admin/users/justfixuser/1/change/|Boop> emailed "
            "a peanut to 3 recipients!"
        )


class TestEmailFileResponseAsAttachment:
    def test_it_works_without_html_body(self, mailoutbox):
        email_file_response_as_attachment(
            subject="here is subject",
            body="here is body",
            recipients=["boop@jones.com", "landlordo@calrissian.net"],
            attachment=FileResponse(BytesIO(b'hi'), filename='hello.txt'),
        )
        assert len(mailoutbox) == 2
        msg = mailoutbox[0]
        assert msg.subject == "here is subject"
        assert msg.body == "here is body"
        assert len(msg.attachments) == 1
        assert msg.attachments[0] == ('hello.txt', 'hi', 'text/plain')
        assert msg.recipients() == ['boop@jones.com']
        assert mailoutbox[1].recipients() == ['landlordo@calrissian.net']
        assert msg.alternatives == []

    def test_it_works_with_html_body(self, mailoutbox):
        email_file_response_as_attachment(
            subject="here is subject",
            body="here is body",
            html_body="<p>here is html body</p>",
            recipients=["boop@jones.com", "landlordo@calrissian.net"],
            attachment=FileResponse(BytesIO(b'hi'), filename='hello.txt'),
        )
        assert len(mailoutbox) == 2
        msg = mailoutbox[0]
        assert msg.body == "here is body"
        assert msg.alternatives == [('<p>here is html body</p>', 'text/html')]
