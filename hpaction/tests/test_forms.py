from typing import List
import pytest

from ..forms import PreviousAttemptsForm, SueForm, HarassmentApartmentForm


def ensure_required_fields_work(form_class, data, expected_required_fields):
    f = form_class(data=data)
    f.is_valid()
    required_fields: List[str] = []
    for field, errors in f.errors.as_data().items():
        required_errors = [e for e in errors if e.code == "required"]
        if required_errors:
            required_fields.append(field)
    assert set(required_fields) == set(expected_required_fields)


class TestPreviousAttemptsForm:
    @pytest.mark.parametrize(
        "data,expected_required_fields",
        [
            ({}, ["filed_with_311"]),
            (dict(filed_with_311="False"), []),
            (dict(filed_with_311="True"), ["hpd_issued_violations"]),
            (dict(filed_with_311="True", hpd_issued_violations="False"), ["thirty_days_since_311"]),
            (
                dict(
                    filed_with_311="True",
                    hpd_issued_violations="False",
                    thirty_days_since_311="True",
                ),
                [],
            ),
            (
                dict(filed_with_311="True", hpd_issued_violations="True"),
                ["thirty_days_since_violations"],
            ),
            (
                dict(
                    filed_with_311="True",
                    hpd_issued_violations="True",
                    thirty_days_since_violations="True",
                ),
                [],
            ),
        ],
    )
    def test_required_fields_work(self, data, expected_required_fields):
        ensure_required_fields_work(PreviousAttemptsForm, data, expected_required_fields)


class TestHarassmentApartmentForm:
    @pytest.mark.parametrize(
        "data,expected_required_fields",
        [
            ({}, ["two_or_less_apartments_in_building"]),
            (dict(two_or_less_apartments_in_building="False"), []),
            (
                dict(two_or_less_apartments_in_building="True"),
                ["more_than_one_family_per_apartment"],
            ),
            (
                dict(
                    two_or_less_apartments_in_building="True",
                    more_than_one_family_per_apartment="True",
                ),
                [],
            ),
        ],
    )
    def test_required_fields_work(self, data, expected_required_fields):
        ensure_required_fields_work(HarassmentApartmentForm, data, expected_required_fields)


class TestSueForm:
    @pytest.mark.parametrize(
        "data",
        [
            dict(sue_for_repairs="on"),
            dict(sue_for_harassment="on"),
            dict(sue_for_repairs="on", sue_for_harassment="on"),
        ],
    )
    def test_it_works_when_at_least_one_box_is_checked(self, data):
        f = SueForm(data=data)
        assert f.is_valid()

    def test_it_raises_error_when_no_boxes_are_checked(self):
        f = SueForm(data={})
        assert f.is_valid() is False
