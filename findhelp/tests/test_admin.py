from findhelp.admin import register, TenantResourceAdmin
from findhelp.models import TenantResource


def test_register_is_noop_if_findhelp_is_disabled(simulate_findhelp_disabled):
    boop = "boop"
    assert register("i am a fake model class")(boop) is boop


class TestTenantResourceAdmin:
    def test_location_and_catchment_area_works(self):
        obj = TenantResource()
        admin = TenantResourceAdmin(TenantResource, "i am a fake admin site")
        assert "Mapbox integration is disabled" in admin.location_and_catchment_area(obj)
