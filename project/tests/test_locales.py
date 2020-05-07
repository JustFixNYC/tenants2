from project.locales import (
    FULLY_SUPPORTED_ONLY,
    PARTIALLY_SUPPORTED_ONLY,
    ALL
)


def test_fully_and_partially_supported_locales_cover_all():
    assert FULLY_SUPPORTED_ONLY.choice_set.union(
        PARTIALLY_SUPPORTED_ONLY.choice_set
    ) == ALL.choice_set
