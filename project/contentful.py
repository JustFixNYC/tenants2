import logging
from django.conf import settings
from django.core.cache import cache
from typing import Any, Dict, Optional
import requests


logger = logging.getLogger(__name__)

ORIGIN = "https://cdn.contentful.com"

CommonStrings = Dict[str, Any]


def _extract_common_strings(items: Any) -> CommonStrings:
    result: CommonStrings = {}

    for item in items:
        fields = item["fields"]
        key = fields.get("id", {}).get("en")
        value = fields.get("value")
        if key and value:
            result[key] = value

    return result


def get_common_strings() -> Optional[CommonStrings]:
    if not (settings.CONTENTFUL_ACCESS_TOKEN and settings.CONTENTFUL_SPACE_ID):
        # Contentful integration is disabled.
        return None

    cache_key = f"contentful_common_strings.{settings.CONTENTFUL_SPACE_ID}"

    result = cache.get(cache_key)

    if result is None:
        try:
            response = requests.get(
                f"{ORIGIN}/spaces/{settings.CONTENTFUL_SPACE_ID}/entries",
                {
                    "access_token": settings.CONTENTFUL_ACCESS_TOKEN,
                    "locale": "*",
                    "metadata.tags.sys.id[in]": settings.CONTENTFUL_COMMON_STRING_TAG,
                },
                timeout=settings.CONTENTFUL_TIMEOUT,
            )
            response.raise_for_status()
            result = _extract_common_strings(response.json()["items"])
            cache.set(cache_key, result, settings.CONTENTFUL_CACHE_TIMEOUT)
        except Exception:
            logger.exception(f"Error while retrieving data from {ORIGIN}")

    return result
