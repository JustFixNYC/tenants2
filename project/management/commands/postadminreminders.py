from typing import List
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand

from project import slack
from project.util.site_util import absolute_reverse
from users.models import JustfixUser
from loc.models import USER_MAILING_NEEDED_Q

# What defines an "old" age for a LOC that we need to mail.
LOC_OLD_AGE = timedelta(days=3)


def get_old_loc_users() -> List[JustfixUser]:
    now = timezone.now()
    all_loc_users = JustfixUser.objects.filter(USER_MAILING_NEEDED_Q).prefetch_related(
        "letter_request"
    )
    return [user for user in all_loc_users if (now - user.letter_request.created_at) >= LOC_OLD_AGE]


class Command(BaseCommand):
    help = "Post admin reminders to Slack."

    def handle(self, *args, **options) -> None:
        users = get_old_loc_users()
        if users:
            count = len(users)
            username = users[0].full_preferred_name
            if count == 1:
                desc = f"One user ({username}) has not had their letter of complaint sent"
            else:
                desc = f"{count} users, including {username}, have not had their letters of complaint sent"
            print(desc)
            self.stdout.write(
                f"Posting reminder to admins about sending letters of complaint: '{desc}'\n"
            )

            url = absolute_reverse("admin:loc_locuser_changelist")
            link = slack.hyperlink(url, text="send letters of complaint")
            slack.sendmsg(
                f"<!channel> {desc} in at least {LOC_OLD_AGE.days} days! Please {link}.",
                is_safe=True,
            )
        else:
            self.stdout.write("No reminders need to be posted.\n")
