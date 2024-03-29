from typing import TypeVar, Type, Dict, Any, Optional
import datetime
import pydantic

from users.models import JustfixUser


T = TypeVar("T", bound="Fields")


# Example values for the Fields class (defined below). Note that the
# keys are the names of the fields as they should appear in Airtable.
#
# To accelerate the creation of an Airtable base with these fields,
# consider using the "exampleairtablecsv" management command.
EXAMPLE_FIELDS = {
    # In Airtable, this should be a "Number" field with an "Integer" format.
    "pk": 1,
    # In Airtable, this should be a "Single line text" field.
    "first_name": "Boop",
    # In Airtable, this should be a "Single line text" field.
    "last_name": "Jones",
    # In Airtable, this should be a "URL" field.
    "admin_url": "https://example.com/admin/users/justfixuser/1/change/",
    # In Airtable, this should be a "Phone number" field.
    "phone_number": "5551234560",
    # In Airtable, this should be a "Checkbox" field.
    "can_we_sms": False,
    # In Airtable, this should be a "Single line text" field.
    "lease_type": "RENT_STABILIZED",
    # In Airtable, this should be a "Single line text" field.
    "borough": "BROOKLYN",
    # In Airtable, this should be a "Date" field.
    "letter_request_date": "2018-01-02",
    # In Airtable, this should be a "Date" field.
    "letter_sent_date": "2018-01-03",
    # In Airtable, this should be a "Single line text" field.
    "letter_rejection_reason": "INCRIMINATION",
    # In Airtable, this should be a "Single line text" field.
    "letter_tracking_number": "EA999999999US",
    # In Airtable, this should be a "Long text" field.
    "address": "123 Boop Way\nApartment 2\nNew York, NY 11201",
    # In Airtable, this should be a "Single line text" field.
    "pad_bbl": "3002920026",
    # In Airtable, this should be a "URL" field.
    "letter_pdf_url": "https://example.com/loc/admin/1/letter.pdf",
    # In Airtable, this should be a "Single line text" field.
    "landlord_name": "Landlordo Calrissian",
    # In Airtable, this should be a "Long text" field.
    "landlord_address": "1 Cloud City",
    # In Airtable, this should be a "Checkbox" field.
    "will_we_mail_letter": True,
    # In Airtable, this should be a "Date" field.
    "hp_latest_documents_date": "2018-02-03",
    # In Airtable, this should be a "Checkbox" field.
    "hp_sue_for_repairs": True,
    # In Airtable, this should be a "Checkbox" field.
    "hp_sue_for_harassment": True,
    # In Airtable, this should be a "Date" field.
    "ehp_latest_filing_date": "2018-02-04",
    # In Airtable, this should be a "Number" field with an "Integer" format.
    "ehp_num_filings": 0,
}


def apply_annotations_to_user(user: JustfixUser, annotations: Dict[str, Any]):
    """
    If the given user wasn't fetched from the database with the given annotations,
    make it appear as though it was. Otherwise, do nothing.
    """

    missing_attrs = [key for key in annotations.keys() if not hasattr(user, key)]
    if missing_attrs:
        u = JustfixUser.objects.filter(pk=user.pk).annotate(**annotations).first()
        for key in missing_attrs:
            setattr(user, key, getattr(u, key))


def get_user_field_for_airtable(user: JustfixUser, field: pydantic.fields.Field) -> Any:
    """
    Given a field name that may have double underscores in it to indicate
    that it spans relationships, find the given user field and
    return it, potentially changing its type for use with Airtable.
    """

    attrs = field.name.split("__")
    obj = user

    final_attr = attrs[-1]
    for attr in attrs[:-1]:
        if not hasattr(obj, attr):
            # The optional spanned relationship doesn't exist.
            return field.default
        obj = getattr(obj, attr)

    if obj is None:
        return field.default
    value = getattr(obj, final_attr)

    if isinstance(value, datetime.datetime):
        # Airtable's date fields expect a UTC date string, e.g. "2014-09-05".
        return value.date().isoformat()

    return value


# These are all the related models we want to fetch when we retrieve
# users from the database, which massively speeds up synchronization.
FIELDS_RELATED_MODELS = [
    "onboarding_info",
    "letter_request",
    "landlord_details",
    "hp_action_details",
]


class Fields(pydantic.BaseModel):
    """
    The fields in a row of our Airtable table. Note that these are
    only the fields we care about and control: the Airtable will
    likely contain extra fields that matter to users, but that
    we don't care about for the purposes of syncing.

    The names of the fields are either attributes of our
    user model, custom annotations, or they are attributes
    of related models, which are named using Django's syntax
    for lookups that span relationships [1]:

    > To span a relationship, just use the field name of related
    > fields across models, separated by double underscores,
    > until you get to the field you want.

    In some cases, we use pydantic's "alias" feature to ensure
    that the Airtable field name is more readable than the
    notation we use internally.

    If the field is a custom annotation, the annotation's
    query expression should appear as an entry in the dictionary
    returned by the `get_annotations()` class method. See that
    class' documentation for more details.

    [1] https://docs.djangoproject.com/en/2.1/topics/db/queries/
    """

    # The primary key of the JustfixUser that the row represents.
    pk: int = -1

    # The user's first name.
    first_name: str = ""

    # The user's last name.
    last_name: str = ""

    # The admin URL where the user info can be viewed/changed.
    admin_url: str = ""

    # The user's phone number.
    phone_number: str = ""

    # Whether we can SMS the user.
    onboarding_info__can_we_sms: bool = pydantic.Field(default=False, alias="can_we_sms")

    # The user's lease type.
    onboarding_info__lease_type: str = pydantic.Field(default="", alias="lease_type")

    # The user's borough.
    onboarding_info__borough: str = pydantic.Field(default="", alias="borough")

    # When the user's letter of complaint was requested.
    letter_request__created_at: Optional[str] = pydantic.Field(
        # Note that it's important to set dates to None/null in Airtable if they don't
        # exist, as Airtable will complain that it can't parse the value if we give it
        # an empty string.
        default=None,
        alias="letter_request_date",
    )

    # When we sent the user's letter of complaint.
    letter_request__letter_sent_at: Optional[str] = pydantic.Field(
        default=None, alias="letter_sent_date"
    )

    # The reason we didn't mail the letter, if applicable.
    letter_request__rejection_reason: str = pydantic.Field(
        default="", alias="letter_rejection_reason"
    )

    # The tracking number for the letter, if we sent it.
    letter_request__tracking_number: str = pydantic.Field(
        default="", alias="letter_tracking_number"
    )

    # The tenant's full mailing address.
    onboarding_info__address_for_mailing: str = pydantic.Field(default="", alias="address")

    # The tenant's boro-block-lot (BBL) number.
    onboarding_info__pad_bbl: str = pydantic.Field(default="", alias="pad_bbl")

    # A link to the letter of complaint PDF.
    letter_request__admin_pdf_url: str = pydantic.Field(default="", alias="letter_pdf_url")

    # The tenant's landlord's name.
    landlord_details__name: str = pydantic.Field(default="", alias="landlord_name")

    # The tenant's landlord's address.
    landlord_details__address: str = pydantic.Field(default="", alias="landlord_address")

    # Whether or not the user wants us to mail the letter for them.
    letter_request__will_we_mail: bool = pydantic.Field(default=False, alias="will_we_mail_letter")

    # The most recent date the user's HP action documents were generated.
    hp_latest_documents_date: Optional[str] = None

    # Whether the user wants to sue for repairs.
    hp_action_details__sue_for_repairs: bool = pydantic.Field(
        default=False, alias="hp_sue_for_repairs"
    )

    # Whether the user wants to sue for harassment.
    hp_action_details__sue_for_harassment: bool = pydantic.Field(
        default=False, alias="hp_sue_for_harassment"
    )

    # The date of the most recent Emergency HP action the user signed.
    ehp_latest_filing_date: Optional[str] = None

    # The number of Emergency HP actions the user signed.
    ehp_num_filings: int = 0

    @classmethod
    def get_annotations(cls) -> Dict[str, Any]:
        """
        Returns a mapping from field names to the query expressions they
        represent.  An entry must exist for every field on our class
        that isn't a built-in model field.  For more documentation on
        what a query expression is, see Django's documentation on
        `annotate()` [1].

        [1] https://docs.djangoproject.com/en/3.0/ref/models/querysets/#annotate
        """

        from django.db.models import Max, Count, Q
        from hpaction.models import HP_DOCUSIGN_STATUS_CHOICES

        signed = Q(hpactiondocuments__docusignenvelope__status=HP_DOCUSIGN_STATUS_CHOICES.SIGNED)

        return {
            "hp_latest_documents_date": Max("hpactiondocuments__created_at"),
            "ehp_latest_filing_date": Max(
                "hpactiondocuments__docusignenvelope__created_at", filter=signed
            ),
            "ehp_num_filings": Count("hpactiondocuments__docusignenvelope", filter=signed),
        }

    @classmethod
    def select_related_and_annotate(cls, queryset):
        """
        Given a Queryset of users, select all related models and apply all
        necessary annotations to create a Fields object without requiring
        any additional database queries. Return the new Queryset.
        """

        return queryset.select_related(*FIELDS_RELATED_MODELS).annotate(**cls.get_annotations())

    @classmethod
    def from_user(cls: Type[T], user: JustfixUser, refresh: bool = False) -> T:
        """
        Given a user, return the Fields that represent their data.

        If `refresh` is True, the user's data will be refreshed from the database.
        """

        kwargs: Dict[str, Any] = {}

        if refresh:
            user = cls.select_related_and_annotate(JustfixUser.objects.filter(pk=user.pk)).first()

        apply_annotations_to_user(user, cls.get_annotations())

        for field in cls.__fields__.values():
            kwargs[field.alias] = get_user_field_for_airtable(user, field)

        return cls(**kwargs)


class Record(pydantic.BaseModel):
    """
    A Record essentially represents a row in our Airtable table.
    """

    # Airtable's unique id for this row, e.g. "recFLEuThPbUkwmsq".
    id: str

    # The fields of this row. We need to call it "fields_" because
    # the attribute "fields" is already used by pydantic.
    fields_: Fields = pydantic.Field(default=..., alias="fields")

    # The date the row was created, e.g. '2018-10-15T20:27:20.000Z'.
    createdTime: str
