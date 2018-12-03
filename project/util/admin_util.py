from typing import Optional, get_type_hints


def admin_field(
    short_description: Optional[str]=None,
    allow_tags: Optional[bool]=None,
    admin_order_field: Optional[str]=None,
):
    '''
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
    '''

    def decorator(fn):
        if short_description is not None:
            fn.short_description = short_description
        if allow_tags is not None:
            fn.allow_tags = allow_tags
        if admin_order_field is not None:
            fn.admin_order_field = admin_order_field
        if get_type_hints(fn).get('return') == bool:
            fn.boolean = True
        return fn
    return decorator


def admin_action(short_description: str):
    '''
    Simple helper to add metadata to custom admin actions.
    '''

    def decorator(fn):
        fn.short_description = short_description
        return fn

    return decorator
