import abc
from typing import List
import logging
from django.http import JsonResponse
from django.contrib.contenttypes.models import ContentType


logger = logging.getLogger(__name__)


class HealthCheck(abc.ABC):
    @property
    def is_enabled(self) -> bool:
        return True

    @property
    def name(self) -> str:
        return self.__class__.__name__

    def is_healthy(self) -> bool:
        try:
            return self.run_check()
        except Exception:
            logger.exception(f'Error while performing {self.name} health check')
            return False

    @abc.abstractmethod
    def run_check(self) -> bool:
        ...


class CheckDatabase(HealthCheck):
    def run_check(self) -> bool:
        obj = ContentType.objects.first()
        return obj is not None


class HealthInfo:
    def __init__(self, healthchecks: List[HealthCheck]) -> None:
        self.check_results = {
            hc.name: hc.is_healthy()
            for hc in healthchecks
            if hc.is_enabled
        }
        unhealthy = [
            name
            for (name, is_healthy) in self.check_results.items()
            if not is_healthy
        ]
        self.status = 503 if unhealthy else 200

    def to_json_response(self) -> JsonResponse:
        return JsonResponse({
            'status': self.status,
            'check_results': self.check_results
        }, status=self.status)


def get_healthchecks() -> List[HealthCheck]:
    return [
        CheckDatabase()
    ]


def check() -> HealthInfo:
    return HealthInfo(get_healthchecks())
