from users.tests.test_admin_user_proxy import UserProxyAdminTester
from .factories import HabitabilityLetterFactory


class TestLaletterbuilderUserAdmin(UserProxyAdminTester):
    list_view_url = "/admin/laletterbuilder/laletterbuilderuser/"

    def create_user(self):
        return HabitabilityLetterFactory().user
