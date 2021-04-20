from django.core.management import BaseCommand
from django.db.models import Case, When, Value, Q
from users.models import JustfixUser

from onboarding.models import SIGNUP_INTENT_CHOICES
from hpaction.models import HP_DOCUSIGN_STATUS_CHOICES


COMPLETE = "COMPLETE"
IN_PROGRESS = "IN_PROGRESS"
NOT_STARTED = "NOT_STARTED"


class Command(BaseCommand):
    help = "Show user progess in each of our products."

    def handle(self, *args, **options):
        users = JustfixUser.objects.annotate(
            loc_progress=Case(
                When(letter_request__isnull=False, then=Value(COMPLETE)),
                When(
                    Q(onboarding_info__signup_intent=SIGNUP_INTENT_CHOICES.LOC)
                    | Q(access_dates__isnull=False),
                    then=Value(IN_PROGRESS),
                ),
                default=Value(NOT_STARTED),
            ),
            ehp_progress=Case(
                When(
                    hpactiondocuments__docusignenvelope__status=HP_DOCUSIGN_STATUS_CHOICES.SIGNED,
                    then=Value(COMPLETE),
                ),
                When(
                    Q(onboarding_info__signup_intent=SIGNUP_INTENT_CHOICES.EHP)
                    | Q(hp_action_details__isnull=False),
                    then=Value(IN_PROGRESS),
                ),
                default=Value(NOT_STARTED),
            ),
            norent_progress=Case(
                When(norent_letters__isnull=False, then=Value(COMPLETE)),
                When(onboarding_info__agreed_to_norent_terms=True, then=Value(IN_PROGRESS)),
                default=Value(NOT_STARTED),
            ),
            evictionfree_progress=Case(
                When(submitted_hardship_declaration__isnull=False, then=Value(COMPLETE)),
                When(onboarding_info__agreed_to_evictionfree_terms=True, then=Value(IN_PROGRESS)),
                default=Value(NOT_STARTED),
            ),
        ).order_by("first_name", "last_name")
        for user in users:
            print(
                user.full_name,
                f"loc: {user.loc_progress}",
                f"ehp: {user.ehp_progress}",
                f"efny: {user.evictionfree_progress}",
                f"norent: {user.norent_progress}",
            )
