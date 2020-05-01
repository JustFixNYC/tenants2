from typing import Optional, Dict, Any
from django.contrib.auth.models import AnonymousUser

from users.models import JustfixUser


class GraphQLStaticRequest:
    def __init__(self, user: Optional[JustfixUser] = None):
        if user is None:
            user = AnonymousUser()
        self.user = user
        self.session: Dict[str, Any] = {}
