from typing import Any, Dict, List, NamedTuple
from typing import Optional, Type
from django.contrib.admin import ModelAdmin

from users.models import JustfixUser
from project.util.admin_util import get_admin_url_for_instance_or_class
from . import action_progress


def get_user_tab_context_info(
    model_admin: ModelAdmin, user: Optional[JustfixUser]
) -> Dict[str, Any]:
    if not user:
        return {}
    return {
        "user_tabs": [
            UserTabView(
                tab=tab,
                user=user,
                model_admin=model_admin,
            )
            for tab in get_user_tabs()
        ]
    }


def get_user_tabs() -> List["UserTab"]:
    from users.models import JustfixUser
    from loc.admin import LOCUser
    from hpaction.admin import HPUser
    from evictionfree.admin import EvictionFreeUser
    from norent.admin import NorentUser

    return [
        UserTab(JustfixUser, "General", "General user details"),
        UserTab(LOCUser, "LOC", "Letter of complaint details", action_progress.LOC_PROGRESS),
        UserTab(HPUser, "HP", "HP action details", action_progress.EHP_PROGRESS),
        UserTab(
            EvictionFreeUser,
            "EFNY",
            "EvictionFreeNY.org details",
            action_progress.EVICTIONFREE_PROGRESS,
        ),
        UserTab(NorentUser, "NoRent", "NoRent.org details", action_progress.NORENT_PROGRESS),
    ]


class UserTab(NamedTuple):
    model_class: Type
    label: str
    description: str
    progress_annotation: Optional[action_progress.ProgressAnnotation] = None


class UserTabView(NamedTuple):
    tab: UserTab
    user: JustfixUser
    model_admin: ModelAdmin

    @property
    def progress_label(self) -> Optional[str]:
        if self.progress:
            return action_progress.PROGRESS_LABELS[self.progress]
        return None

    @property
    def admin_url(self) -> str:
        return get_admin_url_for_instance_or_class(self.tab.model_class, self.user.pk)

    @property
    def progress(self) -> Optional[str]:
        if not self.tab.progress_annotation:
            return None
        return getattr(self.user, self.tab.progress_annotation.name)

    @property
    def is_selected(self) -> bool:
        return self.model_admin.model == self.tab.model_class


class UserWithTabsMixin:
    change_form_template = "users/justfixuser_change_form.html"

    def render_change_form(self, request, context, *args, **kwargs):
        return super().render_change_form(  # type: ignore
            request,
            {
                **context,
                **get_user_tab_context_info(self, kwargs.get("obj")),
            },
            *args,
            **kwargs,
        )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)  # type: ignore
        return queryset.annotate(
            **{anno.name: anno.expression for anno in action_progress.PROGRESS_ANNOTATIONS}
        )
