from .common_data import Choices


ALL = Choices.from_file("locale-choices.json")

FULLY_SUPPORTED = ALL.only("en")

PARTIALLY_SUPPORTED = ALL.only("es")
