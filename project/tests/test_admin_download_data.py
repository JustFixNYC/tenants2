import json
from django.contrib.auth.models import AnonymousUser
import pytest

from project import admin_download_data
from onboarding.tests.factories import OnboardingInfoFactory
from rapidpro.tests.factories import UserContactGroupFactory
from users.tests.factories import UserFactory
from users.permission_util import get_permissions_from_ns_codenames


def test_index_works(admin_client):
    res = admin_client.get("/admin/download-data/")
    assert res.status_code == 200
    assert b"PII" in res.content


def test_csv_works(outreach_client):
    OnboardingInfoFactory()
    res = outreach_client.get("/admin/download-data/userstats.csv")
    assert res.status_code == 200
    assert res["Content-Type"] == "text/csv"
    lines = b"".join(res.streaming_content).decode("utf-8").splitlines()
    assert len(lines) == 2


def test_data_dictionary_works(outreach_client):
    OnboardingInfoFactory()
    res = outreach_client.get("/admin/download-data/dictionary/userstats")
    assert res.status_code == 200
    assert res["Content-Type"] == "text/html; charset=utf-8"


def test_json_works(outreach_client):
    user = OnboardingInfoFactory().user
    UserContactGroupFactory(user=user, group__uuid="1", group__name="Boop")
    UserContactGroupFactory(user=user, group__uuid="2", group__name="Goop")

    res = outreach_client.get("/admin/download-data/userstats.json")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/json"
    records = json.loads(b"".join(res.streaming_content).decode("utf-8"))
    assert len(records) == 1
    assert records[0]["user_id"] == user.pk
    assert records[0]["rapidpro_contact_groups"] == ["Boop", "Goop"]


def test_datasets_return_appropriate_errors(
    outreach_client, disable_locale_middleware, monkeypatch
):
    perms = []

    monkeypatch.setattr(
        admin_download_data,
        "get_all_data_downloads",
        lambda: [
            admin_download_data.DataDownload(
                name="Blarg", slug="blarg", html_desc="Blarg!", perms=perms, execute_query=None
            )
        ],
    )

    res = outreach_client.get("/admin/download-data/nonexistent.json")
    assert res.status_code == 404, "Nonexistent datasets should 404"

    res = outreach_client.get("/admin/download-data/dictionary/nonexistent")
    assert res.status_code == 404, "Nonexistent data dicts should 404"

    res = outreach_client.get("/admin/download-data/blarg.zzz")
    assert res.status_code == 404, "Nonexistent formats should 404"

    perms.append("a_perm_you_do_not_have")

    res = outreach_client.get("/admin/download-data/blarg.json")
    assert res.status_code == 403, "Invalid permissions should 403"

    res = outreach_client.get("/admin/download-data/dictionary/blarg")
    assert res.status_code == 403, "Invalid permissions for data dicts should 403"


def test_csv_is_inaccessible_to_non_staff_users(client, db):
    user = UserFactory()
    client.force_login(user)

    res = client.get("/admin/download-data/userstats.csv")
    assert res.status_code == 302
    assert res.url == f"/admin/login/?next=/admin/download-data/userstats.csv"


def test_strict_get_data_download_works():
    assert admin_download_data.strict_get_data_download("userstats")

    with pytest.raises(ValueError, match="data download does not exist: boop"):
        admin_download_data.strict_get_data_download("boop")


def test_all_permissions_are_valid(db):
    for dd in admin_download_data.get_all_data_downloads():
        print(f"Validating permissions: {', '.join(dd.perms)}")
        get_permissions_from_ns_codenames(dd.perms)


def test_all_data_dictionaries_work(db):
    user = AnonymousUser()
    for dd in admin_download_data.get_all_data_downloads():
        dd.get_data_dictionary(user)
