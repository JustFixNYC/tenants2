import sys
import abc
from typing import List, Dict, Any
import logging
from django.conf import settings
from django.http import JsonResponse
from django.contrib.contenttypes.models import ContentType

from project import geocoding
from nycdb.models import HPDRegistration


logger = logging.getLogger(__name__)


class HealthCheck(abc.ABC):
    # Whether te health check is an "extended" health check, meaning
    # it will take non-trivial resources to perform and therefore
    # shouldn't be run too frequently.
    is_extended: bool = False

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
            logger.exception(f"Error while performing {self.name} health check")
            return False

    @abc.abstractmethod
    def run_check(self) -> bool:
        ...


class CheckDatabase(HealthCheck):
    def run_check(self) -> bool:
        obj = ContentType.objects.first()
        return obj is not None


class CheckGeocoding(HealthCheck):
    @property
    def is_enabled(self) -> bool:
        return bool(settings.GEOCODING_SEARCH_URL)

    def run_check(self) -> bool:
        features = geocoding.search("150 court street, brooklyn")
        if features is None:
            return False
        return features[0].properties.pad_bbl == "3002920026"


class CheckCelery(HealthCheck):
    is_extended = True

    @property
    def is_enabled(self) -> bool:
        return bool(settings.CELERY_BROKER_URL)

    def run_check(self) -> bool:
        from project import tasks

        result = tasks.get_git_revision.apply_async()
        result_str = result.get()
        result.forget()
        return result_str == settings.GIT_INFO.get_version_str()


class CheckNycdb(HealthCheck):
    @property
    def is_enabled(self) -> bool:
        return bool(settings.NYCDB_DATABASE)

    def run_check(self) -> bool:
        obj = HPDRegistration.objects.first()
        return obj is not None


class HealthInfo:
    def __init__(self, healthchecks: List[HealthCheck], is_extended: bool = False) -> None:
        self.is_extended = is_extended
        self.check_results = {
            hc.name: hc.is_healthy()
            for hc in healthchecks
            if hc.is_enabled and (True if is_extended else not hc.is_extended)
        }
        unhealthy = [name for (name, is_healthy) in self.check_results.items() if not is_healthy]
        self.status = 503 if unhealthy else 200

    def to_json(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "is_extended": self.is_extended,
            "python_version": get_python_version(),
            "version": settings.GIT_INFO.get_version_str(),
            "check_results": self.check_results,
        }

    def to_json_response(self) -> JsonResponse:
        return JsonResponse(self.to_json(), status=self.status)


def get_python_version() -> str:
    v = sys.version_info
    return f"{v.major}.{v.minor}.{v.micro}"


def get_healthchecks() -> List[HealthCheck]:
    return [CheckDatabase(), CheckGeocoding(), CheckCelery(), CheckNycdb()]


def check(is_extended: bool) -> HealthInfo:
    return HealthInfo(get_healthchecks(), is_extended)
