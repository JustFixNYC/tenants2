from users.tests.factories import UserFactory


def test_legacy_dashboard_works(admin_client):
    res = admin_client.get("/admin/vega-dashboard/")
    assert res.status_code == 200
    assert b"Dashboard" in res.content


def test_dashboard_404s_if_dashboard_is_disabled(admin_client, disable_locale_middleware):
    res = admin_client.get("/admin/dashboard/")
    assert res.status_code == 404


def test_dashboard_works(admin_client, settings):
    settings.DASHBOARD_DB_ALIAS = "default"
    res = admin_client.get("/admin/dashboard/")
    assert res.status_code == 200
    assert b"Back to admin" in res.content
    assert b"users_justfixuser" in res.content


def test_dashboard_redirects_anonymous_users_to_login(client, settings):
    settings.DASHBOARD_DB_ALIAS = "default"
    res = client.get("/admin/dashboard/")
    assert res.status_code == 302
    assert res["Location"] == "/admin/login/?next=/admin/dashboard/"


def test_dashboard_redirects_non_staff_users_to_login(db, client, settings):
    settings.DASHBOARD_DB_ALIAS = "default"
    client.force_login(UserFactory())
    res = client.get("/admin/dashboard/")
    assert res.status_code == 302
    assert res["Location"] == "/admin/login/?next=/admin/dashboard/"


def test_dashboard_rejects_staff_without_permission(db, client, settings):
    # This is actually testing an assumption about django-sql-dashboard, not our code.
    settings.DASHBOARD_DB_ALIAS = "default"
    client.force_login(UserFactory(is_staff=True))
    res = client.get("/admin/dashboard/")
    assert res.status_code == 403
    assert b"You do not have permission to execute SQL" in res.content
