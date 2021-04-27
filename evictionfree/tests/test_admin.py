from users.tests.test_admin_user_proxy import UserProxyAdminTester
from .factories import SubmittedHardshipDeclarationFactory


class TestNorentUserAdmin(UserProxyAdminTester):
    list_view_url = "/admin/evictionfree/evictionfreeuser/"

    def create_user(self):
        return SubmittedHardshipDeclarationFactory().user
