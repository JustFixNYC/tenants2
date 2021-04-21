def get_user_tab_context_info(user):
    return {"user_tabs": "blah"}


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
