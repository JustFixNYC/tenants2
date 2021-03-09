from findhelp.admin import TenantResourceAdmin
from findhelp.models import TenantResource


class TestTenantResourceAdmin:
    def test_location_and_catchment_area_works(self):
        obj = TenantResource()
        admin = TenantResourceAdmin(TenantResource, "i am a fake admin site")
        assert "Mapbox integration is disabled" in admin.location_and_catchment_area(obj)
