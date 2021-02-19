from datetime import timedelta
from unittest.mock import MagicMock
import pytest

from amplitude import api
from amplitude.api import (
    AMP_BATCH_URL,
    AmpEvent,
    AmpEventUploader,
    IDENTIFY_EVENT,
    unix_time_millis,
    EPOCH,
)


@pytest.mark.parametrize(
    "dt, expected",
    [
        (EPOCH, 0),
        (EPOCH + timedelta(seconds=5), 5000),
    ],
)
def test_unix_time_millis(dt, expected):
    assert unix_time_millis(dt) == expected


class TestAmpEvent:
    @pytest.mark.parametrize(
        "event, expected",
        [
            (AmpEvent(1, "boop"), "user_1_boop"),
            (AmpEvent(2, "foo", insert_id_suffix="zzz"), "user_2_foo_zzz"),
        ],
    )
    def test_insert_id(self, event, expected):
        assert event.insert_id == expected


class TestAmpEventUploader:
    def test_it_does_not_upload_in_dry_run(self, requests_mock):
        mock = requests_mock.post(AMP_BATCH_URL)

        with AmpEventUploader("myapikey", dry_run=True) as uploader:
            event = AmpEvent(1, "myevent")
            uploader.queue(event)

        assert mock.call_count == 0

    def test_it_batches_events(self, requests_mock):
        mock = requests_mock.post(AMP_BATCH_URL)

        with AmpEventUploader("myapikey", dry_run=False) as uploader:
            for i in range(AmpEventUploader.BATCH_SIZE):
                event = AmpEvent(i, "myevent")
                uploader.queue(event)
            uploader.queue(event)
            uploader.queue(event)
            uploader.queue(event)

        assert mock.call_count == 2
        assert len(mock.request_history[0].json()["events"]) == AmpEventUploader.BATCH_SIZE
        assert len(mock.request_history[1].json()["events"]) == 3

    def test_it_retries_on_timeout(self, requests_mock, monkeypatch):
        sleep = MagicMock()
        monkeypatch.setattr(api, "sleep", sleep)
        mock = requests_mock.post(AMP_BATCH_URL, [{"status_code": 429}, {"status_code": 200}])

        with AmpEventUploader("myapikey", dry_run=False) as uploader:
            uploader.queue(AmpEvent(2, "myevent"))

        sleep.assert_called_once_with(api.AMP_RATE_LIMIT_WAIT_SECS)
        assert mock.call_count == 2
        assert mock.request_history[0].json() == mock.request_history[1].json()

    def test_it_works_with_identify_events(self, requests_mock):
        mock = requests_mock.post(AMP_BATCH_URL)

        with AmpEventUploader("myapikey", dry_run=False) as uploader:
            event = AmpEvent(2, IDENTIFY_EVENT, user_properties={"hi": 1})
            uploader.queue(event)

        assert mock.call_count == 1
        payload = mock.last_request.json()
        assert payload["api_key"] == "myapikey"
        assert len(payload["events"]) == 1
        assert payload["events"][0] == {
            "event_type": "$identify",
            "user_id": "justfix:2",
            "user_properties": {"hi": 1},
        }

    def test_it_works_with_normal_events(self, requests_mock):
        mock = requests_mock.post(AMP_BATCH_URL)

        with AmpEventUploader("myapikey", dry_run=False) as uploader:
            event = AmpEvent(
                1,
                "myevent",
                EPOCH,
                event_properties={"eventprop": EPOCH + timedelta(days=1)},
                user_properties={"userprop": 15},
            )
            uploader.queue(event)

        assert mock.call_count == 1
        payload = mock.last_request.json()
        assert payload["api_key"] == "myapikey"
        assert len(payload["events"]) == 1
        assert payload["events"][0] == {
            "event_type": "myevent",
            "insert_id": "user_1_myevent",
            "time": 0,
            "user_id": "justfix:1",
            "user_properties": {"userprop": 15},
            "event_properties": {"eventprop": "1970-01-02T00:00:00+00:00"},
        }
