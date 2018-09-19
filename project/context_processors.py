from django.conf import settings
from django.utils.functional import SimpleLazyObject
from django.utils.safestring import SafeString


GA_INLINE_SCRIPT = """\
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', '%(GA_TRACKING_ID)s', 'auto');
ga('send', 'pageview');
""".strip()


def ga_snippet(request):
    if not settings.GA_TRACKING_ID:
        return ''

    def _get_val():
        inline_script = GA_INLINE_SCRIPT % {
            'GA_TRACKING_ID': settings.GA_TRACKING_ID
        }
        request.allow_inline_script(inline_script)
        return SafeString(f"<script>{inline_script}</script>")

    return {'GA_SNIPPET': SimpleLazyObject(_get_val)}
