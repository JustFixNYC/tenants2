from typing import Optional


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
    '''

    def decorator(fn):
        if short_description is not None:
            fn.short_description = short_description
        if allow_tags is not None:
            fn.allow_tags = allow_tags
        if admin_order_field is not None:
            fn.admin_order_field = admin_order_field
        return fn
    return decorator
