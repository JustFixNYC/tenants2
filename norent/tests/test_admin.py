from users.tests.test_admin_user_proxy import UserProxyAdminTester
from .factories import LetterFactory


class TestNorentUserAdmin(UserProxyAdminTester):
    list_view_url = "/admin/norent/norentuser/"

    def create_user(self):
        return LetterFactory().user
