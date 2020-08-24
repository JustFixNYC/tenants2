from pathlib import Path
from django.core.management import call_command

from project.util.testing_util import Snapshot


MY_DIR = Path(__file__).parent.resolve()

SNAPSHOT_DIR = MY_DIR / "test_sendtesthtmlemail_snapshots"


def test_it_works(db, mailoutbox, allow_lambda_http):
    call_command('sendtesthtmlemail', 'boop@jones.com')
    assert len(mailoutbox) == 1
    msg = mailoutbox[0]
    assert msg.subject == "This is a test HTML email!"

    assert msg.alternatives[0][1] == 'text/html'
    html = msg.alternatives[0][0]
    assert 'href="https://example.com/' in html, "Link should be in HTML"
    assert '.btn {' not in html, "CSS rules should not be in HTML"
    assert 'style="font-family' in html, "CSS should be inlined into HTML"

    snap = Snapshot(msg.body, SNAPSHOT_DIR / "email-body.txt")
    assert snap.actual == snap.expected
