from typing import TypeVar, Callable
from functools import wraps
from django.conf import settings


T = TypeVar('T', bound=Callable)


def fire_and_forget_task(fun: T) -> T:
    '''
    Returns a function whose signature matches the
    arguments of the given function, but always returns
    None.

    When called, if Celery integration is enabled, this will
    proxy the function's arguments to a Celery worker.
    Otherwise, the function will be called synchronously.
    '''

    @wraps(fun)
    def wrapper(*args, **kwargs):
        from project.celery import app

        task_name = f"{fun.__module__}.{fun.__name__}"
        task = app.tasks[task_name]
        assert task.ignore_result is True

        if settings.CELERY_BROKER_URL:
            task.delay(*args, **kwargs)
        else:
            fun(*args, **kwargs)

    return wrapper  # type: ignore
