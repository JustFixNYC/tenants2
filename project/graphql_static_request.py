from typing import Optional, Dict, Any
from django.contrib.auth.models import AnonymousUser

from users.models import JustfixUser


class GraphQLStaticRequest:
    """
    This represents a GraphQL request made on behalf of front-end
    code that is trying to generate static content--such as a PDF
    or email text--and therefore may not have access to an
    actual Django HttpRequest. For example, it may be running in
    a worker process or from a Django management command.

    Because we've already written all our GraphQL mutations to
    expect a Django HttpRequest as the GraphQL context, however,
    our best way to accomodate this use case (without doing a *lot*
    of refactoring) is to create a tiny subset of the HttpRequest
    interface that only our static content-related GraphQL endpoints
    will need to access.
    """

    def __init__(
        self,
        user: Optional[JustfixUser] = None,
        session: Optional[Dict[str, Any]] = None,
    ):
        if user is None:
            user = AnonymousUser()

        # This corresponds to HttpRequest.user.
        self.user = user

        # This corresponds to HttpRequest.session.
        self.session: Dict[str, Any] = session or {}
