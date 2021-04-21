from django.core.management import BaseCommand
from django.db.models import Case, When, Value, Q
from users.models import JustfixUser

from onboarding.models import SIGNUP_INTENT_CHOICES
from hpaction.models import HP_DOCUSIGN_STATUS_CHOICES


COMPLETE = "COMPLETE"
IN_PROGRESS = "IN_PROGRESS"
NOT_STARTED = "NOT_STARTED"

LOC_PROGRESS_EXPR = Case(
    When(letter_request__isnull=False, then=Value(COMPLETE)),
    When(
        Q(onboarding_info__signup_intent=SIGNUP_INTENT_CHOICES.LOC) | Q(access_dates__isnull=False),
        then=Value(IN_PROGRESS),
    ),
    default=Value(NOT_STARTED),
)

EHP_PROGRESS_EXPR = Case(
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
)

NORENT_PROGRESS_EXPR = Case(
    When(norent_letters__isnull=False, then=Value(COMPLETE)),
    When(onboarding_info__agreed_to_norent_terms=True, then=Value(IN_PROGRESS)),
    default=Value(NOT_STARTED),
)

EVICTIONFREE_PROGRESS_EXPR = Case(
    When(submitted_hardship_declaration__isnull=False, then=Value(COMPLETE)),
    When(onboarding_info__agreed_to_evictionfree_terms=True, then=Value(IN_PROGRESS)),
    default=Value(NOT_STARTED),
)

PROGRESS_ANNOTATIONS = dict(
    loc_progress=LOC_PROGRESS_EXPR,
    ehp_progress=EHP_PROGRESS_EXPR,
    norent_progress=NORENT_PROGRESS_EXPR,
    evictionfree_progress=EVICTIONFREE_PROGRESS_EXPR,
)


class Command(BaseCommand):
    help = "Show user progess in each of our products."

    def handle(self, *args, **options):
        users = JustfixUser.objects.annotate(**PROGRESS_ANNOTATIONS).order_by(
            "first_name", "last_name"
        )
        for user in users:
            print(
                user.full_name,
                f"loc: {user.loc_progress}",
                f"ehp: {user.ehp_progress}",
                f"efny: {user.evictionfree_progress}",
                f"norent: {user.norent_progress}",
            )
