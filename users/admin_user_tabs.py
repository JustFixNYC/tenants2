from .action_progress import PROGRESS_ANNOTATIONS, PROGRESS_LABELS


def get_user_tab_context_info(user):
    return {"progress_loc": PROGRESS_LABELS[user.progress_loc]}


class UserWithTabsMixin:
    change_form_template = "users/justfixuser_change_form.html"

    def render_change_form(self, request, context, *args, **kwargs):
        return super().render_change_form(  # type: ignore
            request,
            {
                **context,
                **get_user_tab_context_info(kwargs.get("obj")),
            },
            *args,
            **kwargs,
        )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)  # type: ignore
        return queryset.annotate(**PROGRESS_ANNOTATIONS)
