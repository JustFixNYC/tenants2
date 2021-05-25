from typing import NamedTuple
from django.db.models import Case, When, Value, Q, Expression
from django.db.models.expressions import Exists, OuterRef

from onboarding.models import SIGNUP_INTENT_CHOICES
from loc.models import AccessDate
from hpaction.models import HP_DOCUSIGN_STATUS_CHOICES, DocusignEnvelope
from norent.models import Letter as NorentLetter


NOT_STARTED = "NOT_STARTED"
IN_PROGRESS = "IN_PROGRESS"
COMPLETE = "COMPLETE"

PROGRESS_LABELS = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETE: "Complete",
}


class ProgressAnnotation(NamedTuple):
    name: str
    expression: Expression


LOC_PROGRESS = ProgressAnnotation(
    "loc_progress",
    Case(
        When(letter_request__isnull=False, then=Value(COMPLETE)),
        When(
            Q(onboarding_info__signup_intent=SIGNUP_INTENT_CHOICES.LOC)
            | Q(Exists(AccessDate.objects.filter(user=OuterRef("pk")))),
            then=Value(IN_PROGRESS),
        ),
        default=Value(NOT_STARTED),
    ),
)

EHP_PROGRESS = ProgressAnnotation(
    "ehp_progress",
    Case(
        When(
            Exists(
                DocusignEnvelope.objects.filter(
                    docs__user=OuterRef("pk"), status=HP_DOCUSIGN_STATUS_CHOICES.SIGNED
                )
            ),
            then=Value(COMPLETE),
        ),
        When(
            Q(onboarding_info__signup_intent=SIGNUP_INTENT_CHOICES.EHP)
            | Q(hp_action_details__isnull=False),
            then=Value(IN_PROGRESS),
        ),
        default=Value(NOT_STARTED),
    ),
)

NORENT_PROGRESS = ProgressAnnotation(
    "norent_progress",
    Case(
        When(Exists(NorentLetter.objects.filter(user=OuterRef("pk"))), then=Value(COMPLETE)),
        When(onboarding_info__agreed_to_norent_terms=True, then=Value(IN_PROGRESS)),
        default=Value(NOT_STARTED),
    ),
)

EVICTIONFREE_PROGRESS = ProgressAnnotation(
    "evictionfree_progress",
    Case(
        When(submitted_hardship_declaration__isnull=False, then=Value(COMPLETE)),
        When(onboarding_info__agreed_to_evictionfree_terms=True, then=Value(IN_PROGRESS)),
        default=Value(NOT_STARTED),
    ),
)

PROGRESS_ANNOTATIONS = [LOC_PROGRESS, EHP_PROGRESS, NORENT_PROGRESS, EVICTIONFREE_PROGRESS]
