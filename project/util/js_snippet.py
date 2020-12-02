import abc
from typing import Dict
from functools import partial
from textwrap import dedent
from django.http import HttpRequest
from django.utils.safestring import SafeString
from django.utils.functional import SimpleLazyObject

from project.middleware import CspUpdateDict


class JsSnippetContextProcessor(metaclass=abc.ABCMeta):
    """
    This is an abstract base class that simplifies adding CSP-compliant
    inline JavaScript snippets to templates.

    Instances of this object can be used as Django context processors
    which expose the snippet to templates.
    """

    @property
    @abc.abstractmethod
    def template(self) -> str:
        """
        The template for the JS snippet, using standard Python dictionary-based
        string interpolation. Since it's assumed the JS snippet doesn't
        contain any untrusted data, we shouldn't need anything more sophisticated.

        This may be a string literal that is indented for formatting purposes;
        the class will automatically dedent it as needed.
        """

        pass

    @property
    @abc.abstractmethod
    def var_name(self) -> str:
        """
        The variable name by which templates can access the snippet.
        """

        pass

    @property
    def csp_updates(self) -> CspUpdateDict:
        """
        A dictionary of CSP updates to apply to the CSP policy, if
        any. The dictionary should be structured like the keyword
        arguments to the @csp_update decorator from django-csp:

            https://django-csp.readthedocs.io/en/latest/decorators.html#csp-update
        """

        return {}

    def is_enabled(self) -> bool:
        """
        Whether or not the JS snippet is enabled. This should return False
        if e.g. the snippet is meaningless without some Django setting configured.
        """

        return True

    def get_context(self) -> Dict[str, str]:
        """
        Return the dictionary that the template string will be interpolated over.
        """

        return {}

    def get_html(self, request: HttpRequest) -> SafeString:
        """
        Return the HTML for the snippet, including the <script> tags.

        This can be overridden to provide multiple HTML tags.
        """

        inline_script = dedent(self.template).strip() % self.get_context()
        request.allow_inline_script(inline_script)
        request.csp_update(**self.csp_updates)
        return SafeString(f"<script>{inline_script}</script>")

    def __call__(self, request: HttpRequest) -> Dict[str, str]:
        """
        The template context processor.
        """

        if not self.is_enabled():
            return {}
        return {self.var_name: SimpleLazyObject(partial(self.get_html, request))}
