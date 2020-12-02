from django.conf import settings

from project import health
from project.health import CheckGeocoding, CheckNycdb, CheckCelery
from nycdb.tests import fixtures as nycdb_fixtures
from . import test_geocoding


class TrivialCheck(health.HealthCheck):
    def __init__(self, result=True, is_enabled=True):
        self._result = result
        self._is_enabled = is_enabled

    @property
    def is_enabled(self):
        return self._is_enabled

    def run_check(self):
        return self._result


class TrivialExtendedCheck(TrivialCheck):
    is_extended = True


def test_check_works(db):
    info = health.check(True)
    assert info.status == 200
    assert info.check_results == {"CheckDatabase": True}


def test_extended_checks_work():
    info = health.HealthInfo([TrivialExtendedCheck()])
    assert info.check_results == {}

    info = health.HealthInfo([TrivialExtendedCheck()], is_extended=True)
    assert info.check_results == {"TrivialExtendedCheck": True}


def test_failing_checks_result_in_503_status():
    info = health.HealthInfo([TrivialCheck(result=False)])
    assert info.status == 503
    assert info.check_results == {"TrivialCheck": False}


def test_disabled_checks_are_ignored():
    info = health.HealthInfo([TrivialCheck(is_enabled=False)])
    assert info.status == 200
    assert info.check_results == {}


def test_is_healthy_returns_false_on_exception():
    class ExplodingCheck(health.HealthCheck):
        def run_check(self):
            raise Exception("lol")

    assert ExplodingCheck().is_healthy() is False


def test_is_healthy_returns_run_check_value():
    assert TrivialCheck(result=True).is_healthy() is True
    assert TrivialCheck(result=False).is_healthy() is False


class TestCheckGeocoding:
    def test_it_is_disabled_when_geocoding_is_disabled(self):
        assert CheckGeocoding().is_enabled is False

    def test_it_returns_false_when_geocoding_search_fails(self):
        assert CheckGeocoding().run_check() is False

    @test_geocoding.enable_fake_geocoding
    def test_it_works(self, requests_mock):
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=test_geocoding.EXAMPLE_SEARCH)
        check = CheckGeocoding()
        assert check.is_enabled is True
        assert check.run_check() is True


class TestCheckNycdb:
    def test_it_is_disabled_when_nycdb_is_disabled(self):
        assert CheckNycdb().is_enabled is False

    def test_it_works(self, nycdb):
        nycdb_fixtures.load_hpd_registration("tiny-landlord.json")
        check = CheckNycdb()
        assert check.is_enabled is True
        assert check.is_healthy() is True


class TestCheckCelery:
    def test_it_is_disabled_when_celery_is_disabled(self):
        assert CheckCelery().is_enabled is False

    def test_it_works(self, settings):
        settings.CELERY_BROKER_URL = "blargh"
        check = CheckCelery()
        assert check.is_enabled is True
        assert check.is_healthy() is True
