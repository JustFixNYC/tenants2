from users.tests.test_admin_user_proxy import UserProxyAdminTester
from .factories import LetterSenderLetterFactory


class TestLetterSenderUserAdmin(UserProxyAdminTester):
    list_view_url = "/admin/lettersender/lettersenderuser/"

    def create_user(self):
        return LetterSenderLetterFactory().user
