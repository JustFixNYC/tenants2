from pathlib import Path
from django.conf import settings

from project.util.js_snippet import JsSnippetContextProcessor


MY_DIR = Path(__file__).parent.resolve()


class AmplitudeSnippet(JsSnippetContextProcessor):
    SNIPPET_JS = MY_DIR / "static" / "vendor" / "amplitude-snippet.min.js"

    template = SNIPPET_JS.read_text()

    csp_updates = {
        "CONNECT_SRC": "https://api.amplitude.com",
    }

    var_name = "AMPLITUDE_SNIPPET"

    def is_enabled(self):
        return settings.AMPLITUDE_API_KEY

    def get_context(self):
        return {
            "AMPLITUDE_API_KEY": settings.AMPLITUDE_API_KEY,
            "amplitude_js_url": f"{settings.STATIC_URL}vendor/amplitude-6.2.0.min.js",
            "code_version": settings.GIT_INFO.get_version_str(),
        }


amplitude_snippet = AmplitudeSnippet()
