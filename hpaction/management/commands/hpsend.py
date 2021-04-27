from pathlib import Path
from typing import Optional
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from users.models import JustfixUser
from hpaction.models import UploadToken, HPActionDocuments, HP_ACTION_CHOICES
from hpaction.build_hpactionvars import user_to_hpactionvars
from hpaction import lhiapi


DEFAULT_EXTRACT_BASENAME = "hp-action"

DEFAULT_KIND = HP_ACTION_CHOICES.NORMAL


class Command(BaseCommand):
    help = "Send an HP Action document assembly request."

    def add_arguments(self, parser):
        parser.add_argument(
            "username", help="The username to send an HP Action document assembly request for."
        )
        parser.add_argument(
            "--kind",
            default=DEFAULT_KIND,
            help=(
                f"The kind of HP Action. Choose from "
                f'{", ".join(HP_ACTION_CHOICES.choices_dict.keys())}. Defaults to '
                f"{DEFAULT_KIND}."
            ),
        )
        parser.add_argument(
            "--xml-input-file",
            help=(
                "Send the given HotDocs Answer Set XML file as the input "
                "for document assembly, rather than auto-generating it "
                "from the database."
            ),
        )
        parser.add_argument(
            "--extract-files",
            action="store_true",
            help=("Also extract the assembled documents to the current " "working directory."),
        )
        parser.add_argument(
            "--extract-basename",
            default=DEFAULT_EXTRACT_BASENAME,
            help=(
                f"Basename of the extracted files, for use with --extract-files. "
                f'Defaults to "{DEFAULT_EXTRACT_BASENAME}".'
            ),
        )

    def extract_files(self, docs: HPActionDocuments, basename):
        with docs.xml_file.open() as f:
            extract_xml = f"{basename}.xml"
            self.stdout.write(f"Writing {extract_xml}.\n")
            Path(extract_xml).write_bytes(f.read())
        with docs.pdf_file.open() as f:
            extract_pdf = f"{basename}.pdf"
            self.stdout.write(f"Writing {extract_pdf}.\n")
            Path(extract_pdf).write_bytes(f.read())

    def load_xml_input_file(self, filename: str) -> str:
        path = Path(filename)
        self.stdout.write(f"Using {path.name} as input for document assembly.")
        return path.read_text()

    def handle(self, *args, **options) -> None:
        kind: str = options["kind"]
        if kind not in HP_ACTION_CHOICES.choices_dict:
            raise CommandError(f"Invalid kind: {kind}")

        if not settings.HP_ACTION_CUSTOMER_KEY:
            raise CommandError("HP_ACTION_CUSTOMER_KEY is not defined!")

        user = JustfixUser.objects.get(username=options["username"])
        token = UploadToken.objects.create_for_user(user, kind)
        token.full_clean()

        self.stdout.write("Created upload token. Sending SOAP request...\n")

        xml_input_file: Optional[str] = options["xml_input_file"]
        if xml_input_file:
            hdinfo: lhiapi.HDInfo = self.load_xml_input_file(xml_input_file)
        else:
            hdinfo = user_to_hpactionvars(user, kind)

        docs = lhiapi.get_answers_and_documents(token, hdinfo)

        if docs is None:
            raise CommandError(f"An error occurred when generating the documents.")

        self.stdout.write("Successfully received HP Action documents.\n")

        if options["extract_files"]:
            self.extract_files(docs, basename=options["extract_basename"])
