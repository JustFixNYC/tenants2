from typing import Any, Optional
from graphql import ResolveInfo

from users.models import JustfixUser


class GraphQlUserInfo:
    __user: Optional[JustfixUser] = None

    def get_user(self, info: ResolveInfo) -> JustfixUser:
        return self.__user or info.context.user

    def set_user(self, user: JustfixUser):
        self.__user = user

    @staticmethod
    def get_user_from_parent_or_context(parent: Any, info: ResolveInfo) -> JustfixUser:
        if isinstance(parent, GraphQlUserInfo):
            return parent.get_user(info)
        return info.context.user
