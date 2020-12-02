from typing import Optional, get_type_hints
from django.utils.html import format_html
from django.urls import reverse


def admin_field(
    short_description: Optional[str] = None,
    allow_tags: Optional[bool] = None,
    admin_order_field: Optional[str] = None,
):
    """
    This decorator can be used to easily assign Django
    admin metadata attributes to fields. For more
    details on what fields are supported, see:

        https://docs.djangoproject.com/en/2.1/ref/contrib/admin/

    This class exists partly to reduce verbosity, but
    also to ensure that mypy helps us, instead of us
    having to sprinkle all these attribute assignments
    with 'type: ignore' directives.

    It also automatically looks at the type signature
    of the decorated function, and if it returns a boolean,
    it lets Django-admin know that. For example, say we
    have the following field:

        >>> @admin_field(short_description="Is it cool?")
        ... def is_cool() -> bool:
        ...     return True

    The decorator has examined the return type and added a
    'boolean' attribute to the function:

        >>> is_cool.boolean
        True

    This attribute tells Django's admin to show the field
    as a colored checkmark rather than the word "True" or
    "False".
    """

    def decorator(fn):
        if short_description is not None:
            fn.short_description = short_description
        if allow_tags is not None:
            fn.allow_tags = allow_tags
        if admin_order_field is not None:
            fn.admin_order_field = admin_order_field
        if get_type_hints(fn).get("return") == bool:
            fn.boolean = True
        return fn

    return decorator


def admin_action(short_description: str):
    """
    Simple helper to add metadata to custom admin actions.
    """

    def decorator(fn):
        fn.short_description = short_description
        return fn

    return decorator


def never_has_permission(request=None, obj=None, *args, **kwargs) -> bool:
    """
    A function that a ModelAdmin instance's `has_add_permission`,
    `has_delete_permission`, etc. can be assigned to in order to
    always return False.

    >>> never_has_permission(1, 2, boop=3)
    False
    """

    return False


def get_admin_url_for_instance_or_class(obj, pk) -> str:
    """
    Returns the admin URL for the given Django model instance or class with
    the given primary key.
    """

    # https://stackoverflow.com/a/10420949
    info = (obj._meta.app_label, obj._meta.model_name)
    return reverse("admin:%s_%s_change" % info, args=(pk,))


def get_admin_url_for_class(class_obj, pk) -> str:
    """
    Returns the admin URL for the given Django class with the given primary
    key.
    """

    return get_admin_url_for_instance_or_class(class_obj, pk)


def get_admin_url_for_instance(model_instance) -> str:
    """
    Returns the admin URL for the given Django instance. If the instance has
    an 'admin_url' property, that is given priority.
    """

    admin_url = getattr(model_instance, "admin_url", None)
    if isinstance(admin_url, str):
        return admin_url
    return get_admin_url_for_instance_or_class(model_instance, model_instance.pk)


def make_edit_link(short_description: str, field: Optional[str] = None):
    """
    Created a Django admin field function that returns HTML for a link
    to edit either the object itself (useful for StackedInlines/TabularInlines),
    or a related object with the given field name.
    """

    @admin_field(short_description=short_description, allow_tags=True)
    def edit(self, obj):
        if field:
            obj = getattr(obj, field, None)
        if not (obj and obj.pk):
            return ""
        admin_url = get_admin_url_for_instance(obj)
        return format_html(
            '<a class="button" href="{}">{}</a>',
            admin_url,
            short_description,
        )

    return edit


def make_button_link(url: str, short_description: str):
    return format_html('<a class="button" href="{}">{}</a>', url, short_description)
