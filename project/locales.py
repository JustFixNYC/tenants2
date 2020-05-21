from .common_data import Choices


ALL = Choices.from_file("locale-choices.json")

FULLY_SUPPORTED_ONLY = ALL.only("en")

PARTIALLY_SUPPORTED_ONLY = ALL.only("es")

DEFAULT = ALL.en

LOCALE_KWARGS = dict(
    max_length=5,
    choices=ALL.choices,
    default=DEFAULT,
)
