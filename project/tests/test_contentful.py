import pytest
from django.core.cache import cache

from project.contentful import get_common_strings


ENTRIES_URL = "https://cdn.contentful.com/spaces/myspaceid/entries"

CONTENTFUL_DOC = {
    "nodeType": "document",
    "data": {},
    "content": [
        {
            "nodeType": "paragraph",
            "content": [
                {
                    "nodeType": "text",
                    "value": "Hello!",
                    "marks": [],
                    "data": {},
                },
            ],
        },
    ],
}

RAW_ENTRIES_RESPONSE = {
    "sys": {"type": "Array"},
    "total": 1,
    "skip": 0,
    "limit": 100,
    "items": [
        {
            "metadata": {"tags": [{"sys": {"type": "Link", "linkType": "Tag", "id": "common"}}]},
            "sys": {
                "space": {"sys": {"type": "Link", "linkType": "Space", "id": "markmr2gi204"}},
                "id": "6JHYqWl0h2QWvObWQfNH4m",
                "type": "Entry",
                "createdAt": "2021-06-16T11:01:57.811Z",
                "updatedAt": "2021-06-16T12:44:37.768Z",
                "environment": {"sys": {"id": "master", "type": "Link", "linkType": "Environment"}},
                "revision": 6,
                "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "string"}},
            },
            "fields": {
                "id": {"en": "covidMoratoriumBanner"},
                "value": {
                    "en": CONTENTFUL_DOC,
                },
            },
        }
    ],
}


@pytest.fixture
def enabled(settings):
    settings.CONTENTFUL_ACCESS_TOKEN = "myaccesstoken"
    settings.CONTENTFUL_SPACE_ID = "myspaceid"


class TestGetCommonStrings:
    def setup(self):
        cache.clear()

    def test_it_returns_none_when_disabled(self):
        assert get_common_strings() is None

    def test_it_returns_none_when_enabled_but_err_occurs(self, enabled, requests_mock):
        requests_mock.get(ENTRIES_URL, status_code=500)
        assert get_common_strings() is None

    def test_it_works(self, enabled, requests_mock):
        requests_mock.get(ENTRIES_URL, json=RAW_ENTRIES_RESPONSE)
        assert get_common_strings() == {"covidMoratoriumBanner": {"en": CONTENTFUL_DOC}}

    def test_it_caches_result(self, enabled, requests_mock):
        requests_mock.get(ENTRIES_URL, json=RAW_ENTRIES_RESPONSE)

        strings = get_common_strings()
        assert strings is not None

        requests_mock.get(ENTRIES_URL, status_code=500)

        assert get_common_strings() == strings

    def test_it_does_not_cache_errors(self, enabled, requests_mock):
        requests_mock.get(ENTRIES_URL, status_code=500)

        assert get_common_strings() is None

        requests_mock.get(ENTRIES_URL, json=RAW_ENTRIES_RESPONSE)

        assert get_common_strings() is not None
