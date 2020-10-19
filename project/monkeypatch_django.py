from django.http.response import HttpResponseBase


old_set_cookie = HttpResponseBase.set_cookie


def samesite_none_allowing_set_cookie(self, key, *args, **kwargs):
    '''
    Overrides set_cookie() to accept samesite='None', just like Django
    3.1's version does. Adapted from:

    https://github.com/django/django/commit/b33bfc383935
    '''

    samesite = kwargs.get('samesite')
    set_samesite = False
    if samesite and samesite.lower() == 'none':
        kwargs['samesite'] = None
        set_samesite = True
    old_set_cookie(self, key, *args, **kwargs)
    if set_samesite:
        self.cookies[key]['samesite'] = samesite


HttpResponseBase.set_cookie = samesite_none_allowing_set_cookie
