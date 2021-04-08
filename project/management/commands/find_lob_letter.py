from typing import Any, List
from django.core.management import BaseCommand

from loc import lob_api
from evictionfree.models import SubmittedHardshipDeclaration
from norent.models import Letter as NorentLetter
from loc.models import LetterRequest as LocLetter


MODELS: List[Any] = [SubmittedHardshipDeclaration, NorentLetter, LocLetter]


def is_letter_deleted(lob_id: str) -> bool:
    letter = lob_api.get_letter(lob_id)
    return letter.get("deleted", False)


class Command(BaseCommand):
    help = "Find letter(s) sent via Lob."

    def add_arguments(self, parser):
        parser.add_argument(
            "lob_ids",
            nargs="+",
            metavar="id",
            help='A Lob letter ID. Typically this starts with the text "ltr_".',
        )
        parser.add_argument(
            "--resend",
            action="store_true",
            help="Attempt to re-send the letter if it has been deleted.",
        )

    def attempt_to_resend(self, obj):
        if hasattr(obj, "resend_letter"):
            was_sent = obj.resend_letter()
            print(f"  Re-sent letter: {was_sent}")
        else:
            print(f"  Re-sending this type of letter is currently unsupported.")

    def process_letter(self, obj, resend: bool):
        lob_id = obj.lob_letter_object["id"]
        print(f"Found {lob_id}.")
        print(f"  Name: {obj}")
        print(f"  Created at: {obj.created_at}")
        if hasattr(obj, "admin_pdf_url"):
            print(f"  PDF: {obj.admin_pdf_url}")
        is_deleted = is_letter_deleted(lob_id)
        print(f"  Deleted in Lob: {is_deleted}")
        if is_deleted:
            if resend:
                self.attempt_to_resend(obj)
            else:
                print("  Use the '--resend' argument to re-send this letter.")

    def handle(self, *args, **options):
        lob_ids: List[str] = options["lob_ids"]
        resend: bool = options["resend"]
        found = 0

        for model in MODELS:
            qs = model.objects.filter(lob_letter_object__id__in=lob_ids)
            for obj in qs:
                found += 1
                self.process_letter(obj, resend=resend)

        print(f"Found {found} of {len(lob_ids)} letter(s).")
