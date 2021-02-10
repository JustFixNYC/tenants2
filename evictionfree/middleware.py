from typing import Optional
from django.utils.translation.trans_real import (
    language_code_re,
    parse_accept_lang_header,
    get_supported_language_variant,
)
from django.http import HttpResponseRedirect

from project.common_data import Choices
from project.util.site_util import get_site_from_request_or_default, get_site_type, SITE_CHOICES


UNSUPPORTED_LOCALE_CHOICES = Choices.from_file("evictionfree-unsupported-locale-choices.json")

UNSUPPORTED_LOCALE_CHOICE_SET = UNSUPPORTED_LOCALE_CHOICES.choice_set


def _is_language_supported(lang: str) -> bool:
    try:
        get_supported_language_variant(lang)
        return True
    except LookupError:
        return False


def get_redirect_for_unsupported_locale(request) -> Optional[HttpResponseRedirect]:
    """
    Given an HttpRequest, determines if it has a locale preference for an explicitly
    unsupported EvictionFreeNY.org locale, and if so, redirects the client to
    a page that offers alternative resources for users of that locale.
    """

    if request.path_info == "/":
        site = get_site_from_request_or_default(request)
        if get_site_type(site) == SITE_CHOICES.EVICTIONFREE:
            accept = request.META.get("HTTP_ACCEPT_LANGUAGE", "")
            # Most of this is taken from:
            # https://github.com/django/django/blob/master/django/utils/translation/trans_real.py
            for accept_lang, _ in parse_accept_lang_header(accept):
                if accept_lang == "*":
                    break

                if not language_code_re.search(accept_lang):
                    continue

                if _is_language_supported(accept_lang):
                    break

                twochar_lang = accept_lang.lower()[:2]
                if twochar_lang in UNSUPPORTED_LOCALE_CHOICE_SET:
                    return HttpResponseRedirect(f"/unsupported-locale/{twochar_lang}")
    return None


def unsupported_locale_middleware(get_response):
    """
    Intercepts requests that are for EvictionFreeNY.org but are for an
    explicitly unsupported locale, and redirects them to alternative resources
    if needed.
    """

    def middleware(request):
        if redirect := get_redirect_for_unsupported_locale(request):
            return redirect

        return get_response(request)

    return middleware
