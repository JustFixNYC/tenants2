from typing import Any, List
from django.core.management import BaseCommand

from evictionfree.models import SubmittedHardshipDeclaration
from norent.models import Letter as NorentLetter
from loc.models import LetterRequest as LocLetter


MODELS: List[Any] = [SubmittedHardshipDeclaration, NorentLetter, LocLetter]


class Command(BaseCommand):
    help = "Find letter(s) sent via Lob."

    def add_arguments(self, parser):
        parser.add_argument(
            "lob_ids",
            nargs="+",
            metavar="id",
            help='A Lob letter ID. Typically this starts with the text "ltr_".',
        )

    def handle(self, *args, **options):
        lob_ids: List[str] = options["lob_ids"]

        for model in MODELS:
            qs = model.objects.filter(lob_letter_object__id__in=lob_ids)
            for obj in qs:
                lob_id = obj.lob_letter_object["id"]
                print(f"Found {lob_id}: {obj}.")
                if hasattr(obj, "admin_pdf_url"):
                    print(f"  PDF: {obj.admin_pdf_url}")
