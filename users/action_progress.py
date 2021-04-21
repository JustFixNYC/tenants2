from django.db.models import Case, When, Value, Q

from onboarding.models import SIGNUP_INTENT_CHOICES
from hpaction.models import HP_DOCUSIGN_STATUS_CHOICES


NOT_STARTED = "NOT_STARTED"
IN_PROGRESS = "IN_PROGRESS"
COMPLETE = "COMPLETE"

PROGRESS_LABELS = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETE: "Complete",
}

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
    progress_loc=LOC_PROGRESS_EXPR,
    progress_ehp=EHP_PROGRESS_EXPR,
    progress_norent=NORENT_PROGRESS_EXPR,
    progress_evictionfree=EVICTIONFREE_PROGRESS_EXPR,
)
