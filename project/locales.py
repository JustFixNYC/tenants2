from .common_data import Choices


ALL = Choices.from_file("locale-choices.json")

FULLY_SUPPORTED_ONLY = ALL.only("en")

PARTIALLY_SUPPORTED_ONLY = ALL.only("es")
