from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
import zeep

from users.models import JustfixUser
from hpaction.views import SUCCESSFUL_UPLOAD_TEXT
from hpaction.models import UploadToken, HPActionDocuments
import hpaction.hpactionvars as hp


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

    def handle(self, *args, **options) -> None:
        if not settings.HP_ACTION_CUSTOMER_KEY:
            raise CommandError('HP_ACTION_CUSTOMER_KEY is not defined!')

        user = JustfixUser.objects.get(username=options['username'])
        token = UploadToken.objects.create_for_user(user)
        token_id = token.id

        self.stdout.write('Created upload token. Sending SOAP request...\n')
        client = zeep.Client(f"{settings.HP_ACTION_API_ENDPOINT}?wsdl")

        v = hp.HPActionVariables()
        v.server_name_full_te = user.full_name
        v.server_name_full_hpd_te = user.full_name
        v.tenant_name_first_te = user.first_name
        v.tenant_name_last_te = user.last_name

        answers = v.to_answer_set()

        result = client.service.GetAnswersAndDocuments(
            CustomerKey=settings.HP_ACTION_CUSTOMER_KEY,
            TemplateId=settings.HP_ACTION_TEMPLATE_ID,
            HDInfo=str(answers),
            DocID=token_id,
            PostBackUrl=token.get_upload_url()
        )

        if result != SUCCESSFUL_UPLOAD_TEXT:
            raise CommandError(
                f"Received unexpected response from server: {result}")

        self.stdout.write("Successfully received HP Action documents.\n")

        if options['extract_files']:
            self.extract_files(token_id, basename=options['extract_basename'])
