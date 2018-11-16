from pathlib import Path
from typing import Optional
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
import zeep

from users.models import JustfixUser
from hpaction.views import SUCCESSFUL_UPLOAD_TEXT
from hpaction.models import UploadToken, HPActionDocuments
from hpaction.build_hpactionvars import user_to_hpactionvars


DEFAULT_EXTRACT_BASENAME = 'hp-action'


class Command(BaseCommand):
    help = (
        'Send an HP Action document assembly request.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            help='The username to send an HP Action document assembly request for.'
        )
        parser.add_argument(
            '--xml-input-file',
            help=(
                'Send the given HotDocs Answer Set XML file as the input '
                'for document assembly, rather than auto-generating it '
                'from the database.'
            )
        )
        parser.add_argument(
            '--extract-files',
            action='store_true',
            help=(
                'Also extract the assembled documents to the current '
                'working directory.'
            )
        )
        parser.add_argument(
            '--extract-basename',
            default=DEFAULT_EXTRACT_BASENAME,
            help=(
                f'Basename of the extracted files, for use with --extract-files. '
                f'Defaults to "{DEFAULT_EXTRACT_BASENAME}".'
            )
        )

    def extract_files(self, token_id, basename):
        docs = HPActionDocuments.objects.get(id=token_id)
        with docs.xml_file.open() as f:
            extract_xml = f'{basename}.xml'
            self.stdout.write(f'Writing {extract_xml}.\n')
            Path(extract_xml).write_bytes(f.read())
        with docs.pdf_file.open() as f:
            extract_pdf = f'{basename}.pdf'
            self.stdout.write(f'Writing {extract_pdf}.\n')
            Path(extract_pdf).write_bytes(f.read())

    def create_answer_set_xml(self, user: JustfixUser) -> str:
        v = user_to_hpactionvars(user)
        return str(v.to_answer_set())

    def load_xml_input_file(self, filename: str) -> str:
        path = Path(filename)
        self.stdout.write(f"Using {path.name} as input for document assembly.")
        return path.read_text()

    def handle(self, *args, **options) -> None:
        if not settings.HP_ACTION_CUSTOMER_KEY:
            raise CommandError('HP_ACTION_CUSTOMER_KEY is not defined!')

        user = JustfixUser.objects.get(username=options['username'])
        token = UploadToken.objects.create_for_user(user)
        token_id = token.id

        self.stdout.write('Created upload token. Sending SOAP request...\n')
        client = zeep.Client(f"{settings.HP_ACTION_API_ENDPOINT}?wsdl")

        xml_input_file: Optional[str] = options['xml_input_file']
        if xml_input_file:
            hdinfo = self.load_xml_input_file(xml_input_file)
        else:
            hdinfo = self.create_answer_set_xml(user)

        result = client.service.GetAnswersAndDocuments(
            CustomerKey=settings.HP_ACTION_CUSTOMER_KEY,
            TemplateId=settings.HP_ACTION_TEMPLATE_ID,
            HDInfo=hdinfo,
            DocID=token_id,
            PostBackUrl=token.get_upload_url()
        )

        if result != SUCCESSFUL_UPLOAD_TEXT:
            raise CommandError(
                f"Received unexpected response from server: {result}")

        self.stdout.write("Successfully received HP Action documents.\n")

        if options['extract_files']:
            self.extract_files(token_id, basename=options['extract_basename'])
