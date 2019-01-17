from project import health


class TrivialCheck(health.HealthCheck):
    def __init__(self, result=True, is_enabled=True):
        self._result = result
        self._is_enabled = is_enabled

    @property
    def is_enabled(self):
        return self._is_enabled

    def run_check(self):
        return self._result


def test_check_works(db):
    info = health.check()
    assert info.status == 200
    assert info.check_results == {
        'CheckDatabase': True
    }


def test_failing_checks_result_in_503_status():
    info = health.HealthInfo([TrivialCheck(result=False)])
    assert info.status == 503
    assert info.check_results == {
        'TrivialCheck': False
    }


def test_disabled_checks_are_ignored():
    info = health.HealthInfo([TrivialCheck(is_enabled=False)])
    assert info.status == 200
    assert info.check_results == {}


def test_is_healthy_returns_false_on_exception():
    class ExplodingCheck(health.HealthCheck):
        def run_check(self):
            raise Exception('lol')

    assert ExplodingCheck().is_healthy() is False


def test_is_healthy_returns_run_check_value():
    assert TrivialCheck(result=True).is_healthy() is True
    assert TrivialCheck(result=False).is_healthy() is False
