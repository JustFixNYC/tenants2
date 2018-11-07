from datetime import timedelta
from typing import Optional
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


class HPActionDocuments(models.Model):
    '''
    A model used to store the HP Action documents (paperwork) for
    a user, provided to us by an external service.
    '''

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
        upload_to='hp-action/xml/',
        help_text="The XML file for the HP action."
    )

    pdf_file = models.FileField(
        upload_to='hp-action/pdf/',
        help_text="The PDF file for the HP action paperwork."
    )

    objects = HPActionDocumentsManager()

    def schedule_for_deletion(self):
        self.user = None
        self.save()


class UploadTokenManager(models.Manager):
    def create_for_user(self, user: JustfixUser) -> 'UploadToken':
        'Create an upload token bound to the given user.'

        # It's so unlikely that this token will collide with another
        # that we're not even going to bother with retry logic.
        token = UploadToken(
            user=user,
            token=get_random_string(length=UPLOAD_TOKEN_LENGTH)
        )
        token.save()
        return token

    def find_unexpired(self, token: str) -> Optional['UploadToken']:
        '''
        Find the token with the given string, returning None if
        the token is not found or it's expired.
        '''

        return self.filter(
            token=token,
            created_at__gt=timezone.now() - UPLOAD_TOKEN_LIFETIME
        ).first()

    def remove_expired(self) -> None:
        'Delete all expired tokens from the database.'

        self.filter(created_at__lte=timezone.now() - UPLOAD_TOKEN_LIFETIME).delete()


class UploadToken(models.Model):
    '''
    An upload token represents a token an external service
    can use to upload HP Action documents to the server.

    It is bound to a particular user and is time-limited
    to prevent abuse.
    '''

    created_at = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE)

    token = models.CharField(max_length=UPLOAD_TOKEN_LENGTH, unique=True)

    objects = UploadTokenManager()

    def create_documents_from(self, xml_data: bytes, pdf_data: bytes) -> HPActionDocuments:
        '''
        Consume the token and create HP Action documents associated with
        the user it's bound to, and the given data.
        '''

        user = self.user
        basename = f'hp-action-{user.username}'

        # We don't really want to wrap the following in a transaction because
        # of how storing the files changes the world outside our database. e.g., if
        # deleting the token fails, we still want to keep a record of the files
        # we created in our storage service so we can delete them later.
        docs = HPActionDocuments(
            user=user,
            xml_file=SimpleUploadedFile(f'{basename}.xml', content=xml_data),
            pdf_file=SimpleUploadedFile(f'{basename}.pdf', content=pdf_data)
        )
        docs.save()
        self.delete()

        return docs

    def get_upload_url(self) -> str:
        '''
        Returns an absolute path to the upload URL for this token.
        '''

        return absolute_reverse('hpaction:upload', kwargs={
            'token_str': self.token
        })
