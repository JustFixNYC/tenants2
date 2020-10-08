import pytest

from norent.models import Letter, RentPeriod, UpcomingLetterRentPeriod
from users.tests.factories import UserFactory, SecondUserFactory
from .factories import LetterFactory, RentPeriodFactory


class TestLetter:
    def test_str_works_on_brand_new_models(self):
        assert str(Letter()) == "Letter object (None)"

    def test_str_works_on_filled_out_models(self, db):
        letter = LetterFactory()
        assert str(letter) == "Boop Jones's no rent letter for 2020-05-01"

    def test_latest_rent_period_works_on_brand_new_models(self, db):
        letter = LetterFactory()
        letter.rent_periods.clear()
        assert letter.latest_rent_period is None

    def test_latest_rent_period_works_on_filled_out_models(self, db):
        letter = LetterFactory()
        letter.rent_periods.add(RentPeriodFactory.from_iso("2020-10-01"))
        assert str(letter.latest_rent_period.payment_date) == "2020-10-01"


class TestRentPeriod:
    def test_get_by_iso_date_works(self, db):
        rp = RentPeriodFactory.from_iso("2020-10-01")
        assert RentPeriod.objects.get_by_iso_date("2020-10-01") == rp
        with pytest.raises(RentPeriod.DoesNotExist):
            RentPeriod.objects.get_by_iso_date("2020-05-01")

    def test_to_iso_date_list_works(self):
        rps = [RentPeriodFactory.build()]
        assert RentPeriod.to_iso_date_list(rps) == ["2020-05-01"]


class TestUpcomingLetterRentPeriod:
    def test_get_and_set_for_user_work(self, db):
        u1 = UserFactory()
        u2 = SecondUserFactory()
        RentPeriodFactory.from_iso("2020-05-01")
        RentPeriodFactory.from_iso("2020-06-01")
        set_for_user = UpcomingLetterRentPeriod.objects.set_for_user
        get_for_user = UpcomingLetterRentPeriod.objects.get_for_user

        assert get_for_user(u1) == []
        assert get_for_user(u2) == []

        set_for_user(u1, ["2020-05-01"])
        set_for_user(u2, ["2020-05-01", "2020-06-01"])
        assert get_for_user(u1) == ["2020-05-01"]
        assert get_for_user(u2) == ["2020-05-01", "2020-06-01"]

        set_for_user(u1, ["2020-06-01"])
        assert get_for_user(u1) == ["2020-06-01"]

        # Ensure duplicates are removed.
        set_for_user(u1, ["2020-05-01", "2020-05-01"])
        assert get_for_user(u1) == ["2020-05-01"]
