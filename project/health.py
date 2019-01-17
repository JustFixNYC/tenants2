import abc
from django.http import JsonResponse
from django.contrib.contenttypes.models import ContentType


class HealthCheck(abc.ABC):
    @property
    def is_enabled(self) -> bool:
        return True

    @property
    def name(self) -> str:
        return self.__class__.__name__

    @abc.abstractmethod
    def check(self) -> bool:
        ...


class CheckDatabase(HealthCheck):
    def check(self) -> bool:
        obj = ContentType.objects.first()
        return obj is not None


def check() -> JsonResponse:
    healthchecks = [
        CheckDatabase()
    ]
    results = {
        hc.name: hc.check()
        for hc in healthchecks
        if hc.is_enabled
    }
    status = 200 if filter(None, results.values()) else 503
    return JsonResponse({
        'status': status,
        'checks': results
    }, status=status)
