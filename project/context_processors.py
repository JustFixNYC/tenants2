from pathlib import Path
from django.conf import settings

from project.util.js_snippet import JsSnippetContextProcessor


MY_DIR = Path(__file__).parent.resolve()


class FacebookPixelSnippet(JsSnippetContextProcessor):
    template = '''
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '%(FACEBOOK_PIXEL_ID)s');
    fbq('track', 'PageView');
    '''

    var_name = 'FACEBOOK_PIXEL_SNIPPET'

    csp_updates = {
        'SCRIPT_SRC': 'https://connect.facebook.net',
        'IMG_SRC': 'https://www.facebook.com',
    }

    def is_enabled(self):
        return settings.FACEBOOK_PIXEL_ID

    def get_context(self):
        return {
            'FACEBOOK_PIXEL_ID': settings.FACEBOOK_PIXEL_ID
        }


facebook_pixel_snippet = FacebookPixelSnippet()


class GoogleAnalyticsSnippet(JsSnippetContextProcessor):
    template = '''
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', '%(GA_TRACKING_ID)s', 'auto');
    ga('send', 'pageview');
    '''

    var_name = 'GA_SNIPPET'

    GA_ORIGIN = 'https://www.google-analytics.com'

    csp_updates = {
        'IMG_SRC': GA_ORIGIN,
        'SCRIPT_SRC': GA_ORIGIN,
        'CONNECT_SRC': GA_ORIGIN
    }

    def is_enabled(self):
        return settings.GA_TRACKING_ID

    def get_context(self):
        return {
            'GA_TRACKING_ID': settings.GA_TRACKING_ID
        }


ga_snippet = GoogleAnalyticsSnippet()


class RollbarSnippet(JsSnippetContextProcessor):
    SNIPPET_JS = MY_DIR / 'static' / 'vendor' / 'rollbar-snippet.min.js'

    template = """\
    var _rollbarConfig = {
        accessToken: "%(ROLLBAR_ACCESS_TOKEN)s",
        rollbarJsUrl: "%(rollbar_js_url)s",
        captureUncaught: true,
        captureUnhandledRejections: true,
        payload: {
            environment: "%(environment)s",
            client: {
                source_map_enabled: true,
                code_version: "%(code_version)s"
            }
        }
    };
    // Rollbar Snippet
    """ + SNIPPET_JS.read_text() + """
    // End Rollbar Snippet
    """

    csp_updates = {
        'CONNECT_SRC': 'https://api.rollbar.com'
    }

    var_name = 'ROLLBAR_SNIPPET'

    def is_enabled(self):
        return settings.ROLLBAR_ACCESS_TOKEN

    def get_context(self):
        return {
            'ROLLBAR_ACCESS_TOKEN': settings.ROLLBAR_ACCESS_TOKEN,
            'environment': 'development' if settings.DEBUG else 'production',
            'rollbar_js_url': f'{settings.STATIC_URL}vendor/rollbar-2.4.6.min.js',
            'code_version': settings.GIT_INFO.get_version_str(),
        }


rollbar_snippet = RollbarSnippet()
