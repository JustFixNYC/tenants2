from django.conf import settings
from django.utils.functional import SimpleLazyObject
from django.utils.safestring import SafeString


GA_SNIPPET = """\
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=%(GA_TRACKING_ID)s"></script>
<script nonce="%(nonce)s">
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '%(GA_TRACKING_ID)s');
  window.GA_TRACKING_ID = '%(GA_TRACKING_ID)s';
</script>""".strip()


def ga_snippet(request):
    if not settings.GA_TRACKING_ID:
        return ''

    def _get_val():
        return SafeString(GA_SNIPPET % {
            'GA_TRACKING_ID': settings.GA_TRACKING_ID,
            'nonce': request.csp_nonce
        })

    return {'GA_SNIPPET': SimpleLazyObject(_get_val)}
