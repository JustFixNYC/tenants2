from project.locales import (
    FULLY_SUPPORTED,
    PARTIALLY_SUPPORTED,
    ALL
)


def test_fully_and_partially_supported_locales_cover_all():
    assert FULLY_SUPPORTED.choice_set.union(PARTIALLY_SUPPORTED.choice_set) == ALL.choice_set
