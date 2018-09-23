from project.util.js_snippet import JsSnippetContextProcessor
import frontend.safe_mode


class SafeModeJsSnippet(JsSnippetContextProcessor):
    @property
    def template(self) -> str:
        return frontend.safe_mode.SAFE_MODE_JS.read_text()

    var_name = 'SAFE_MODE_SNIPPET'


def safe_mode(request):
    is_enabled = frontend.safe_mode.is_enabled(request)
    ctx = {'is_safe_mode_enabled': is_enabled}
    ctx.update(SafeModeJsSnippet()(request))
    return ctx
