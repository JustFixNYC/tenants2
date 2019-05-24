from decimal import Decimal
from datetime import timedelta
from typing import Optional, Union
from enum import Enum
from django.db import models
from django.utils.crypto import get_random_string
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

from project.util.site_util import absolute_reverse
from users.models import JustfixUser


# The length, in characters, of an upload token.
UPLOAD_TOKEN_LENGTH = 40

# How long an upload token is valid.
UPLOAD_TOKEN_LIFETIME = timedelta(minutes=5)


class FeeWaiverDetails(models.Model):
    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name='fee_waiver_details',
        help_text="The user whom this fee waiver is for."
    )

    income_amount_monthly: Decimal = models.DecimalField(max_digits=10, decimal_places=2)

    income_src_employment: bool = models.BooleanField()

    income_src_hra: bool = models.BooleanField()

    income_src_child_support: bool = models.BooleanField()

    income_src_alimony: bool = models.BooleanField()

    rent_amount: Decimal = models.DecimalField(max_digits=10, decimal_places=2)

    expense_utilities: bool = models.BooleanField()

    expense_cable: bool = models.BooleanField()

    expense_phone: bool = models.BooleanField()

    expense_childcare: bool = models.BooleanField()

    asked_before: bool = models.BooleanField()


class HPActionDocumentsManager(models.Manager):
    def purge(self) -> None:
        '''
        Purge any documents that have been scheduled for deletion.
        This means that not only will the records be removed
        from the database, but the files associated with them
        will be deleted as well.
        '''

        docs = list(self.filter(user=None).all())
        for doc in docs:
            # We intentionally don't want to wrap this in a transaction
            # because each delete() call will be making changes to
            # the world outside our database.
            #
            # However, this does mean that if one of the following
            # calls fails, we should be able to re-run this method
            # to retry the whole operation.
            doc.xml_file.delete()
            doc.pdf_file.delete()
            doc.delete()

    def create_from_file_data(
        self,
        xml_data: bytes,
        pdf_data: bytes,
        id: str,
        **kwargs
    ) -> 'HPActionDocuments':
        '''
        Create HP Action documents from the given file data.
        '''

        docs = HPActionDocuments(
            xml_file=SimpleUploadedFile(
                f'{id}.xml',
                content=xml_data,
                content_type='text/xml'
            ),
            pdf_file=SimpleUploadedFile(
                f'{id}.pdf',
                content=pdf_data,
                content_type='application/pdf'
            ),
            id=id,
            **kwargs
        )
        docs.save()
        return docs

    def get_latest_for_user(self, user: JustfixUser) -> Optional['HPActionDocuments']:
        return self.filter(user=user).order_by('-created_at').first()


class HPActionDocuments(models.Model):
    '''
    A model used to store the HP Action documents (paperwork) for
    a user, provided to us by an external service.
    '''

    class Meta:
        verbose_name_plural = 'HP Action Documents'

    # The id will be the same as the id of the upload token that
    # the external service used to submit the documents.
    id = models.CharField(max_length=UPLOAD_TOKEN_LENGTH, primary_key=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    # We don't want to cascade deletions here because we need
    # the model instance around to eventually delete the
    # actual documents that this model represents. So we'll
    # set this field to NULL when its corresponding user is
    # deleted, which will indicate that the associated
    # files should eventually be deleted.
    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=(
            "The user the HP action is associated with. "
            "If empty, the documents will be scheduled for "
            "deletion."
        )
    )

    xml_file = models.FileField(
        upload_to='hp-action-docs/',
        help_text="The XML file for the HP action."
    )

    pdf_file = models.FileField(
        upload_to='hp-action-docs/',
        help_text="The PDF file for the HP action paperwork."
    )

    objects = HPActionDocumentsManager()

    def schedule_for_deletion(self):
        self.user = None
        self.save()


class UploadTokenManager(models.Manager):
    def set_errored(self, token_id: str) -> None:
        'Set the errored flag for the given token ID, if it exists.'

        token = self.filter(id=token_id).first()
        if token:
            token.errored = True
            token.save()

    def create_for_user(self, user: JustfixUser) -> 'UploadToken':
        'Create an upload token bound to the given user.'

        # It's so unlikely that this token will collide with another
        # that we're not even going to bother with retry logic.
        token = UploadToken(
            id=get_random_string(length=UPLOAD_TOKEN_LENGTH),
            user=user
        )
        token.save()
        return token

    def find_unexpired(self, token: str) -> Optional['UploadToken']:
        '''
        Find the token with the given string, returning None if
        the token is not found or it's expired.
        '''

        return self.filter(
            id=token,
            created_at__gt=timezone.now() - UPLOAD_TOKEN_LIFETIME
        ).first()

    def remove_expired(self) -> None:
        'Delete all expired tokens from the database.'

        self.filter(created_at__lte=timezone.now() - UPLOAD_TOKEN_LIFETIME).delete()

    def get_latest_for_user(self, user: JustfixUser) -> Optional['UploadToken']:
        return self.filter(user=user).order_by('-created_at').first()


class UploadToken(models.Model):
    '''
    An upload token represents a token an external service
    can use to upload HP Action documents to the server.

    It is bound to a particular user and is time-limited
    to prevent abuse.
    '''

    id = models.CharField(max_length=UPLOAD_TOKEN_LENGTH, primary_key=True)

    created_at = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE)

    # This tracks whether an error occurred at some point during
    # document assembly or the upload process, which can be useful
    # if we need to generate the documents asynchronously.
    errored = models.BooleanField(default=False)

    objects = UploadTokenManager()

    def is_expired(self) -> bool:
        return self.created_at <= timezone.now() - UPLOAD_TOKEN_LIFETIME

    def create_documents_from(self, xml_data: bytes, pdf_data: bytes) -> HPActionDocuments:
        '''
        Consume the token and create HP Action documents associated with
        the user it's bound to, and the given data.
        '''

        # We don't really want to wrap the following in a transaction because
        # of how storing the files changes the world outside our database. e.g., if
        # deleting the token fails, we still want to keep a record of the files
        # we created in our storage service so we can delete them later.

        docs = HPActionDocuments.objects.create_from_file_data(
            xml_data=xml_data,
            pdf_data=pdf_data,
            user=self.user,
            id=self.id
        )
        self.delete()

        return docs

    def get_upload_url(self) -> str:
        '''
        Returns an absolute path to the upload URL for this token.
        '''

        return absolute_reverse('hpaction:upload', kwargs={
            'token_str': self.id
        })


class HPUploadStatus(Enum):
    'The status of the HP Action upload (document assembly) process for a user.'

    NOT_STARTED = 0
    STARTED = 1
    ERRORED = 2
    SUCCEEDED = 3

    @property
    def description(self) -> str:
        if self == HPUploadStatus.NOT_STARTED:
            return 'The user has not yet initiated document assembly.'
        if self == HPUploadStatus.STARTED:
            return ("The user has initiated document assembly, and we're waiting for a "
                    "remote service to upload the result to us.")
        if self == HPUploadStatus.ERRORED:
            return "Something went wrong during the document assembly process."
        if self == HPUploadStatus.SUCCEEDED:
            return "The document assembly process was successful."
        raise AssertionError()  # pragma: nocover


def _get_latest_docs_or_tok(user: JustfixUser) -> Union[HPActionDocuments, HPUploadStatus, None]:
    docs = HPActionDocuments.objects.get_latest_for_user(user)
    tok = UploadToken.objects.get_latest_for_user(user)
    if docs and tok:
        if docs.created_at >= tok.created_at:
            return docs
        return tok
    return docs or tok


def get_upload_status_for_user(user: JustfixUser) -> HPUploadStatus:
    thing = _get_latest_docs_or_tok(user)
    if isinstance(thing, HPActionDocuments):
        return HPUploadStatus.SUCCEEDED
    elif isinstance(thing, UploadToken):
        if thing.is_expired() or thing.errored:
            return HPUploadStatus.ERRORED
        return HPUploadStatus.STARTED
    return HPUploadStatus.NOT_STARTED
