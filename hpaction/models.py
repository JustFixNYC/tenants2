from decimal import Decimal
from datetime import timedelta, date
from typing import Optional, Union, List
from enum import Enum
from django.db import models
from django.utils.crypto import get_random_string
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

from .hpactionvars import HarassmentAllegationsMS
from project.util.site_util import absolute_reverse
from project import common_data
from users.models import JustfixUser

COMMON_DATA = common_data.load_json("hp-action.json")

# The length, in characters, of an upload token.
UPLOAD_TOKEN_LENGTH = 40

# How long an upload token is valid.
UPLOAD_TOKEN_LIFETIME = timedelta(minutes=5)

CURRENCY_KWARGS = dict(max_digits=10, decimal_places=2)


def attr_name_for_harassment_allegation(name: str) -> str:
    return f"alleg_{name.lower()}"


class HarassmentDetails(models.Model):
    '''
    Represents a user's harassment information.
    '''

    class Meta:
        verbose_name = "Harassment details"

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name='harassment_details',
        help_text="The user whom the harassment details are for."
    )

    more_than_two_apartments_in_building: Optional[bool] = models.NullBooleanField(
        help_text="Are there more than two apartments in your building?"
    )

    more_than_one_family_per_apartment: Optional[bool] = models.NullBooleanField(
        help_text="Is there more than one family living in each apartment?"
    )

    harassment_details: str = models.TextField(
        blank=True,
        max_length=COMMON_DATA['HARASSMENT_DETAILS_MAX_LENGTH'],
        help_text="Explain how the landlord has harassed you."
    )

    for _enum in HarassmentAllegationsMS:
        locals()[attr_name_for_harassment_allegation(_enum.name)] = models.BooleanField(
            default=False,
            verbose_name=f"Harassment allegation: {_enum.name}",
            help_text=f"Whether the tenant alleges the landlord has {_enum.name}."
        )
    del _enum


class FeeWaiverDetails(models.Model):
    class Meta:
        verbose_name = "Fee waiver"

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name='fee_waiver_details',
        help_text="The user whom this fee waiver is for."
    )

    receives_public_assistance: Optional[bool] = models.NullBooleanField(
        help_text=(
            "Whether the user receives any kind of public assistance benefits, e.g. "
            "cash benefits, rent assistance, food stamps, Medicaid."
        )
    )

    income_amount_monthly: Optional[Decimal] = models.DecimalField(
        **CURRENCY_KWARGS,
        help_text="The amount of income the user receives per month.",
        null=True
    )

    income_src_employment: bool = models.BooleanField(
        verbose_name="Employment",
        help_text="Whether the user receives income from employment.",
        default=False
    )

    income_src_hra: bool = models.BooleanField(
        verbose_name="HRA",
        help_text=(
            "Whether the user receives income from the Human Resources Administration "
            "(e.g., Temporary Aid to Needy Families)."
        ),
        default=False
    )

    income_src_child_support: bool = models.BooleanField(
        verbose_name="Child support",
        help_text="Whether the user receives income from child support.",
        default=False
    )

    income_src_alimony: bool = models.BooleanField(
        verbose_name="Alimony",
        help_text="Whether the user receives income from alimony.",
        default=False
    )

    income_src_other: str = models.CharField(
        max_length=100,
        help_text="Other income the user receives",
        blank=True
    )

    rent_amount: Optional[Decimal] = models.DecimalField(
        **CURRENCY_KWARGS,
        help_text="The amount of money the user pays in rent per month.",
        null=True
    )

    expense_utilities: Decimal = models.DecimalField(**CURRENCY_KWARGS, default=0)

    expense_cable: Decimal = models.DecimalField(**CURRENCY_KWARGS, default=0)

    expense_phone: Decimal = models.DecimalField(**CURRENCY_KWARGS, default=0)

    expense_childcare: Decimal = models.DecimalField(**CURRENCY_KWARGS, default=0)

    expense_other: Decimal = models.DecimalField(**CURRENCY_KWARGS, default=0)

    asked_before: Optional[bool] = models.NullBooleanField(
        help_text="Whether the user has requested a fee waiver before.",
    )

    @property
    def income_sources(self) -> List[str]:
        attrs = [
            'income_src_employment',
            'income_src_hra',
            'income_src_child_support',
            'income_src_alimony'
        ]
        sources: List[str] = []
        for attr in attrs:
            if getattr(self, attr):
                sources.append(self._meta.get_field(attr).verbose_name)
        if self.income_src_other:
            sources.append(self.income_src_other)
        return sources

    @property
    def non_utility_expenses(self) -> Decimal:
        return (
            self.expense_cable +
            self.expense_phone +
            self.expense_childcare +
            self.expense_other
        )


class PriorCase(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name='prior_hp_action_cases',
        help_text="The user who this prior case belongs to.")

    case_number: str = models.CharField(
        max_length=9,
        help_text="The court case number (also known as the \"index number\")."
    )

    case_date: date = models.DateField(help_text="The date of the case.")

    is_harassment: bool = models.BooleanField(help_text="Whether this is a harassment case.")

    is_repairs: bool = models.BooleanField(help_text="Whether this is a repairs case.")

    @property
    def case_type(self) -> str:
        return ' & '.join(filter(None, [
            'harassment' if self.is_harassment else '',
            'repairs' if self.is_repairs else ''
        ]))

    def __str__(self) -> str:
        return f"{self.case_type} case #{self.case_number} on {self.case_date}"


class TenantChild(models.Model):
    class Meta:
        verbose_name_plural = "Tenant children"

    created_at = models.DateTimeField(auto_now_add=True, null=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name='children',
        help_text="The user who this child belongs to.")

    name: str = models.CharField(max_length=80, help_text="The child's name.")

    dob: date = models.DateField(help_text="The child's date of birth.")


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


class HPActionDetails(models.Model):
    '''
    Details related to a user's HP action.
    '''

    class Meta:
        verbose_name_plural = 'HP Action Details'

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name='hp_action_details',
        help_text="The user whom the HP action is for."
    )

    sue_for_repairs: Optional[bool] = models.NullBooleanField(
        help_text=(
            "Whether the user wants to sue for repairs."
        )
    )

    sue_for_harassment: Optional[bool] = models.NullBooleanField(
        help_text=(
            "Whether the user wants to sue for harassment."
        )
    )

    filed_with_311: Optional[bool] = models.NullBooleanField(
        help_text=(
            "Whether the user has filed any complaints with 311 before."
        )
    )

    thirty_days_since_311: Optional[bool] = models.NullBooleanField(
        help_text=(
            "Whether 30 days have passed since the user filed complaints with 311."
        )
    )

    hpd_issued_violations: Optional[bool] = models.NullBooleanField(
        help_text=(
            "Whether HPD issued any violations."
        )
    )

    thirty_days_since_violations: Optional[bool] = models.NullBooleanField(
        help_text=(
            "Whether 30 days have passed since HPD issued violations."
        )
    )

    urgent_and_dangerous: Optional[bool] = models.NullBooleanField(
        help_text=(
            "Whether the conditions are urgent and dangerous."
        )
    )


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
