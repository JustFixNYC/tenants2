from django.db import DEFAULT_DB_ALIAS

from users.models import JustfixUser


def exec_queryset_on_cursor(queryset, cursor):
    '''
    Executes the given Django queryset on the given database cursor.
    '''

    compiler = queryset.query.get_compiler(using=DEFAULT_DB_ALIAS)
    sql, params = compiler.as_sql()
    cursor.execute(sql, params)


def filter_users_to_partner_orgs(queryset, user: JustfixUser):
    '''
    Filter the given queryset to contain only data about non-staff users
    who have been referred to us by the one of the partner orgs
    the given user is affiliated with.
    '''

    partner_orgs = list(user.partner_orgs.all()) if hasattr(user, 'partner_orgs') else []
    if partner_orgs:
        queryset = queryset.filter(partner_orgs__in=partner_orgs)
    else:
        # This feels weird, but it seems to be the only easy
        # way for us to get an empty result set that still
        # includes the column names.
        queryset = queryset.filter(id=-1)
    return queryset.exclude(is_staff=True)


def execute_partner_users_query(cursor, user):
    queryset = JustfixUser.objects.values(
        'id',
        'phone_number',
        'email',
        'first_name',
        'last_name',
        'onboarding_info__pad_bbl',
        'onboarding_info__pad_bin',
        'onboarding_info__lease_type',
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
    )
    queryset = filter_users_to_partner_orgs(queryset, user)
    exec_queryset_on_cursor(queryset, cursor)
