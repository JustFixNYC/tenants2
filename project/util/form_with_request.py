from typing import Optional
from django.http import HttpRequest


class FormWithRequestMixin:
    """
    A mixin for Django forms that optionally allows a request to be provided,
    which allows validation logic to take its properties (e.g., the current user)
    into account.

    If a request is provided via the included `set_request` method, it needs
    to be done immediately after instantiating the form, i.e. before the
    form's validation logic is actually carried out.
    """

    request: Optional[HttpRequest] = None

    def set_request(self, request: HttpRequest):
        self.request = request

    @classmethod
    def try_to_set_request_on_form(cls, form, request: HttpRequest):
        """
        If the given form is a subclass of us, set its request. Otherwise,
        do nothing.
        """

        if isinstance(form, cls):
            form.set_request(request)
