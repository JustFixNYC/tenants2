from typing import Dict, Any
from project.util.js_snippet import JsSnippetContextProcessor
import frontend.safe_mode


class SafeModeJsSnippet(JsSnippetContextProcessor):
    @property
    def template(self) -> str:
        return frontend.safe_mode.SAFE_MODE_JS.read_text()

    var_name = "SAFE_MODE_SNIPPET"


class SafeModeHistoryFixJsSnippet(JsSnippetContextProcessor):
    @property
    def template(self) -> str:
        return frontend.safe_mode.SAFE_MODE_HISTORY_FIX_JS.read_text()

    var_name = "SAFE_MODE_SNIPPET"


def safe_mode(request):
    is_enabled = frontend.safe_mode.is_enabled(request)
    ctx: Dict[str, Any] = {"is_safe_mode_enabled": is_enabled}
    if is_enabled:
        ctx.update(SafeModeHistoryFixJsSnippet()(request))
    else:
        ctx.update(SafeModeJsSnippet()(request))
    return ctx
