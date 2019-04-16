from io import StringIO
from django.core.management import call_command

from users.tests.factories import UserFactory, SecondUserFactory
from issues.models import Issue, CustomIssue


class TestUserStats:
    def test_it_works(self, db):
        user1 = UserFactory()
        user2 = SecondUserFactory()

        Issue.objects.set_area_issues_for_user(user1, 'HOME', [
            'HOME__MICE', 'HOME__RATS'
        ])
        Issue.objects.set_area_issues_for_user(user2, 'HOME', [
            'HOME__MICE'
        ])
        CustomIssue.objects.set_for_user(user1, 'HOME', 'blah')

        out = StringIO()
        call_command('issuestats', stdout=out)
        assert out.getvalue().splitlines() == [
            'area,value,count',
            'HOME,MICE,2',
            'HOME,CUSTOM_ISSUE,1',
            'HOME,RATS,1'
        ]
