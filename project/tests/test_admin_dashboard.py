def test_legacy_dashboard_works(admin_client):
    res = admin_client.get("/admin/vega-dashboard/")
    assert res.status_code == 200
    assert b"Dashboard" in res.content
