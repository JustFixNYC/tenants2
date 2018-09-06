from issues import models


def test_issue_choice_categories_are_valid():
    categories = set([value for (value, _) in models.ISSUE_AREA_CHOICES.choices])
    for value, _ in models.ISSUE_CHOICES.choices:
        category, _ = value.split('__')
        assert category in categories
