from typing import TypeVar, Callable
from functools import wraps
from django.conf import settings
from celery import shared_task


T = TypeVar('T', bound=Callable)


def fire_and_forget_task(fun: T) -> T:
    '''
    If Celery integration is enabled, this will return
    a proxy for the function that takes the same arguments
    but calls it asynchronously and returns None.

    If Celery integration is disabled, this will just return
    the function.
    '''

    if settings.CELERY_BROKER_URL:
        task = shared_task(ignore_result=True)(fun)

        @wraps(fun)
        def wrapper(*args, **kwargs):
            task.delay(*args, **kwargs)

        return wrapper  # type: ignore
    return fun
