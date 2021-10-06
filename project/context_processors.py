from typing import Dict
from pathlib import Path
from textwrap import dedent
from django.conf import settings
from django.utils.safestring import SafeString

from project.util.js_snippet import JsSnippetContextProcessor


MY_DIR = Path(__file__).parent.resolve()


class FullstorySnippet(JsSnippetContextProcessor):
    template = """
    window['_fs_debug'] = false;
    window['_fs_host'] = 'fullstory.com';
    window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
    window['_fs_org'] = '%(FULLSTORY_ORG_ID)s';
    window['_fs_namespace'] = 'FS';
    (function(m,n,e,t,l,o,g,y){
        if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
        g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
        o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_script;
        y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
        g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};g.setUserVars=function(v,s){g(l,v,s)};g.event=function(i,v,s){g('event',{n:i,p:v},s)};
        g.anonymize=function(){g.identify(!!0)};
        g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
        g.log = function(a,b){g("log",[a,b])};
        g.consent=function(a){g("consent",!arguments.length||a)};
        g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
        g.clearUserCookie=function(){};
        g.setVars=function(n, p){g('setVars',[n,p]);};
        g._w={};y='XMLHttpRequest';g._w[y]=m[y];y='fetch';g._w[y]=m[y];
        if(m[y])m[y]=function(){return g._w[y].apply(this,arguments)};
        g._v="1.3.0";
    })(window,document,window['_fs_namespace'],'script','user');
    """  # noqa

    var_name = "FULLSTORY_SNIPPET"

    csp_updates = {
        "SCRIPT_SRC": "https://edge.fullstory.com",
        "CONNECT_SRC": "https://rs.fullstory.com",
    }

    def is_enabled(self):
        return settings.FULLSTORY_ORG_ID

    def get_context(self):
        return {"FULLSTORY_ORG_ID": settings.FULLSTORY_ORG_ID}


fullstory_snippet = FullstorySnippet()


class FacebookPixelSnippet(JsSnippetContextProcessor):
    template = """
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '%(FACEBOOK_PIXEL_ID)s');
    fbq('set','agent','tmgoogletagmanager', '%(FACEBOOK_PIXEL_ID)s');
    fbq('track', "PageView");
    """

    var_name = "FACEBOOK_PIXEL_SNIPPET"

    csp_updates = {
        "SCRIPT_SRC": "https://connect.facebook.net",
        "IMG_SRC": "https://www.facebook.com",
    }

    def is_enabled(self):
        return settings.FACEBOOK_PIXEL_ID

    def get_context(self):
        return {"FACEBOOK_PIXEL_ID": settings.FACEBOOK_PIXEL_ID}


facebook_pixel_snippet = FacebookPixelSnippet()


def facebook_pixel_noscript_snippet(request) -> Dict[str, str]:
    if not settings.FACEBOOK_PIXEL_ID:
        return {}
    url = f"https://www.facebook.com/tr?id={settings.FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1"
    snippet = dedent(
        f"""
        <noscript>
        <img height="1" width="1" style="display:none" src="{url}" />
        </noscript>
        """
    )
    return {"FACEBOOK_PIXEL_NOSCRIPT_SNIPPET": SafeString(snippet)}


class GoogleAnalyticsSnippet(JsSnippetContextProcessor):
    template = """
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', '%(GA_TRACKING_ID)s', 'auto');
    ga('send', 'pageview');
    """

    var_name = "GA_SNIPPET"

    GA_ORIGIN = "https://www.google-analytics.com"

    csp_updates = {"IMG_SRC": GA_ORIGIN, "SCRIPT_SRC": GA_ORIGIN, "CONNECT_SRC": GA_ORIGIN}

    def is_enabled(self):
        return settings.GA_TRACKING_ID

    def get_context(self):
        return {"GA_TRACKING_ID": settings.GA_TRACKING_ID}


ga_snippet = GoogleAnalyticsSnippet()


class GoogleTagManagerSnippet(JsSnippetContextProcessor):
    template = """
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','%(GTM_CONTAINER_ID)s');
    """

    var_name = "GTM_SNIPPET"

    GTM_ORIGIN = "https://www.googletagmanager.com"

    csp_updates = {
        "IMG_SRC": [
            GTM_ORIGIN,
            # https://www.quora.com/What-is-stats-g-doubleclick-net
            "https://stats.g.doubleclick.net",
            # It looks like this is likely for Google Remarketing:
            # https://support.google.com/analytics/answer/2611268?hl=en
            "https://www.google.com",
        ],
        "SCRIPT_SRC": [
            GTM_ORIGIN,
            # Our GTM injects YouTube's iframe API: https://stackoverflow.com/q/37384775
            "https://www.youtube.com",
            "https://s.ytimg.com",
        ],
    }

    def is_enabled(self):
        return settings.GTM_CONTAINER_ID

    def get_context(self):
        return {"GTM_CONTAINER_ID": settings.GTM_CONTAINER_ID}


gtm_snippet = GoogleTagManagerSnippet()


def gtm_noscript_snippet(request) -> Dict[str, str]:
    if not settings.GTM_CONTAINER_ID:
        return {}
    snippet = dedent(
        f"""
        <noscript>
        <iframe src="https://www.googletagmanager.com/ns.html?id={settings.GTM_CONTAINER_ID}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe>
        </noscript>
        """
    )
    return {"GTM_NOSCRIPT_SNIPPET": SafeString(snippet)}


class RollbarSnippet(JsSnippetContextProcessor):
    SNIPPET_JS = MY_DIR / "static" / "vendor" / "rollbar-snippet.min.js"

    template = (
        """\
    var _rollbarConfig = {
        accessToken: "%(ROLLBAR_ACCESS_TOKEN)s",
        rollbarJsUrl: "%(rollbar_js_url)s",
        captureUncaught: true,
        captureUnhandledRejections: true,
        payload: {
            environment: "%(environment)s",
            client: {
                javascript: {
                    source_map_enabled: true,
                    code_version: "%(code_version)s"
                }
            }
        }
    };
    // Rollbar Snippet
    """
        + SNIPPET_JS.read_text()
        + """
    // End Rollbar Snippet
    """
    )

    csp_updates = {"CONNECT_SRC": "https://api.rollbar.com"}

    var_name = "ROLLBAR_SNIPPET"

    def is_enabled(self):
        return settings.ROLLBAR_ACCESS_TOKEN

    def get_context(self):
        return {
            "ROLLBAR_ACCESS_TOKEN": settings.ROLLBAR_ACCESS_TOKEN,
            "environment": "development" if settings.DEBUG else "production",
            "rollbar_js_url": f"{settings.STATIC_URL}vendor/rollbar-2.16.2.min.js",
            "code_version": settings.GIT_INFO.get_version_str(),
        }


rollbar_snippet = RollbarSnippet()
