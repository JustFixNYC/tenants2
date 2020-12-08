from django.contrib.auth.models import AnonymousUser
from django.core.management import call_command

from users.models import JustfixUser
from users.tests.factories import UserFactory, SecondUserFactory
from .factories import PartnerOrgFactory
from partnerships.admin_data_downloads import filter_users_to_partner_orgs


class TestFilterUsersToPartnerOrgs:
    def test_it_works_with_anonymous_users(self, db):
        UserFactory()
        qs = filter_users_to_partner_orgs(JustfixUser.objects.all(), AnonymousUser())
        assert qs.count() == 0

    def test_it_excludes_non_affiliated_users(self, db):
        partner = PartnerOrgFactory()
        UserFactory()
        admin_user = SecondUserFactory(is_staff=True)
        admin_user.partner_orgs.add(partner)

        qs = filter_users_to_partner_orgs(JustfixUser.objects.all(), admin_user)
        assert qs.count() == 0

    def test_it_excludes_users_from_other_orgs(self, db):
        partner = PartnerOrgFactory()
        partner2 = PartnerOrgFactory(slug="blarf", name="Blarf")
        user = UserFactory()
        user.partner_orgs.add(partner2)
        admin_user = SecondUserFactory(is_staff=True)
        admin_user.partner_orgs.add(partner)

        qs = filter_users_to_partner_orgs(JustfixUser.objects.all(), admin_user)
        assert qs.count() == 0

    def test_it_works(self, db):
        partner = PartnerOrgFactory()
        user = UserFactory()
        admin_user = SecondUserFactory(is_staff=True)
        user.partner_orgs.add(partner)
        admin_user.partner_orgs.add(partner)

        qs = filter_users_to_partner_orgs(JustfixUser.objects.all(), admin_user)
        assert qs.count() == 1
        assert list(qs) == [user]


def test_partner_users(db):
    call_command('exportstats', 'partner-users')


def test_partner_user_issues(db):
    call_command('exportstats', 'partner-user-issues')


def test_partner_user_custom_issues(db):
    call_command('exportstats', 'partner-user-custom-issues')
