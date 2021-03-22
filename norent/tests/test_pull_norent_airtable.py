import pytest

from django.core.management import call_command, CommandError
from norent.management.commands.pull_norent_airtable import Table, convert_rows_to_state_dict


class TestConvertRowsToStateDict:
    @pytest.mark.parametrize(
        "raw_rows,state_dict",
        [
            ([], {}),
            (
                [{"fields": {"ID": 1, "State": "WV", "Boop": 2, "To be used": True}}],
                {"WV": {"boop": 2}},
            ),
            (
                [{"fields": {"State": "WV", "Boop Jones?": 2, "To be used": True}}],
                {"WV": {"boopJones": 2}},
            ),
            ([{"fields": {"State": "WV", "Boop Jones?": 2}}], {}),
            (
                [
                    {
                        "fields": {
                            "State": "WV",
                            "To be used": True,
                            "Text (English)": "Hello",
                            "Text (Spanish)": "Hola",
                        }
                    }
                ],
                {"WV": {"text": "Hello"}},
            ),
            (
                [
                    {
                        "fields": {
                            "State": "WV",
                            "thingy": 2,
                            "thingy source (not exposed)": 5,
                            "To be used": True,
                        }
                    }
                ],
                {"WV": {"thingy": 2}},
            ),
            (
                [{"fields": {"State": "WV", "thingy source (not exposed)": 5, "To be used": True}}],
                {},
            ),
            (
                [
                    {
                        "fields": {
                            "State": "WV",
                            "textOfLegislation1": "blah",
                            "textOfLegislation2": "\nmeh",
                            "To be used": True,
                        }
                    }
                ],
                {"WV": {"textOfLegislation": ["blah", "meh"]}},
            ),
            ([{"fields": {}}], {}),
        ],
    )
    def test_it_works(self, raw_rows, state_dict):
        result = convert_rows_to_state_dict(
            Table.STATE_DOCUMENTATION_REQUIREMENTS,
            raw_rows,
            "en",
        )
        assert result == state_dict


def test_it_raises_error_if_airtable_is_not_configured():
    with pytest.raises(CommandError, match="AIRTABLE_API_KEY"):
        call_command("pull_norent_airtable")
