from django.core.management.base import BaseCommand
from django.contrib.sessions.models import Session

from onboarding.schema import session_key_for_step


SCHEMA_NAME = "onboarding step 1"


class Command(BaseCommand):
    def handle(self, *args, **options):
        count = 0
        for session_model in Session.objects.all():
            session = session_model.get_decoded()
            step_1 = session.get(session_key_for_step(1))
            if step_1:
                if "preferred_first_name" not in step_1:
                    count += 1
                    print(
                        f"Session expiring {session_model.expire_date} is using "
                        f"deprecated {SCHEMA_NAME} schema."
                    )
        print(f"Done. {count} Existing sessions are using deprecated {SCHEMA_NAME} schemas.")
