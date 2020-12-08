from typing import Dict, Any
from django.db import DEFAULT_DB_ALIAS

from users.models import JustfixUser
from issues.models import Issue, CustomIssue
from project.admin_download_data import DataDownload


def exec_queryset_on_cursor(queryset, cursor):
    '''
    Executes the given Django queryset on the given database cursor.
    '''

    compiler = queryset.query.get_compiler(using=DEFAULT_DB_ALIAS)
    sql, params = compiler.as_sql()
    cursor.execute(sql, params)


def _dictprefix(prefix: str, **kwargs: Any) -> Dict[str, Any]:
    return {
        f"{prefix}{key}": value for key, value in kwargs.items()
    }


def filter_users_to_partner_orgs(queryset, user: JustfixUser, prefix: str = ''):
    '''
    Filter the given queryset to contain only data about non-staff users
    who have been referred to us by the one of the partner orgs
    the given user is affiliated with.
    '''

    partner_orgs = list(user.partner_orgs.all()) if hasattr(user, 'partner_orgs') else []
    if partner_orgs:
        queryset = queryset.filter(**_dictprefix(prefix, partner_orgs__in=partner_orgs))
    else:
        # This feels weird, but it seems to be the only easy
        # way for us to get an empty result set that still
        # includes the column names.
        queryset = queryset.filter(**_dictprefix(prefix, id=-1))
    return queryset.exclude(**_dictprefix(prefix, is_staff=True))


def execute_partner_users_query(cursor, user):
    queryset = JustfixUser.objects.values(
        'id',
        'date_joined',
        'phone_number',
        'email',
        'first_name',
        'last_name',
        'onboarding_info__pad_bbl',
        'onboarding_info__pad_bin',
        'onboarding_info__lease_type',
        'onboarding_info__address',
        'onboarding_info__borough',
        'onboarding_info__state',
        'onboarding_info__zipcode',
        'onboarding_info__apt_number',
        'onboarding_info__is_in_eviction',
        'onboarding_info__needs_repairs',
        'onboarding_info__has_no_services',
        'onboarding_info__has_pests',
        'onboarding_info__has_called_311',
        'onboarding_info__receives_public_assistance',
    ).order_by('id')
    queryset = filter_users_to_partner_orgs(queryset, user)
    exec_queryset_on_cursor(queryset, cursor)


def execute_partner_user_issues_query(cursor, user):
    queryset = Issue.objects.values(
        'user_id',
        'area',
        'value',
    ).order_by('user_id', 'area', 'value')
    queryset = filter_users_to_partner_orgs(queryset, user, 'user__')
    exec_queryset_on_cursor(queryset, cursor)


def execute_partner_user_custom_issues_query(cursor, user):
    queryset = CustomIssue.objects.values(
        'user_id',
        'area',
        'description',
    ).order_by('user_id', 'area')
    queryset = filter_users_to_partner_orgs(queryset, user, 'user__')
    exec_queryset_on_cursor(queryset, cursor)


DATA_DOWNLOADS = [
    DataDownload(
        name="Partner-affiliated users",
        slug="partner-users",
        html_desc="""
            Details about users who were referred to JustFix by
            partner organization(s) you're affiliated with. Contains PII.
            """,
        perms=['partnerships.view_users'],
        execute_query=execute_partner_users_query,
    ),
    DataDownload(
        name="Partner-affiliated user issues",
        slug="partner-user-issues",
        html_desc="""
            Details about the issues of users who were referred to JustFix by
            partner organization(s) you're affiliated with.
            """,
        perms=['partnerships.view_users'],
        execute_query=execute_partner_user_issues_query,
    ),
    DataDownload(
        name="Partner-affiliated user custom issues",
        slug="partner-user-custom-issues",
        html_desc="""
            Details about the custom issues of users who were referred to JustFix by
            partner organization(s) you're affiliated with. May contain PII.
            """,
        perms=['partnerships.view_users'],
        execute_query=execute_partner_user_custom_issues_query,
    ),
]
