from typing import TypeVar, Callable
from functools import wraps
from django.conf import settings
from django.utils.module_loading import autodiscover_modules


T = TypeVar('T', bound=Callable)


def fire_and_forget_task(fun: T) -> T:
    '''
    Returns a function whose signature matches the
    arguments of the given function, but always returns
    None. (Ideally we would modify the type signature to
    return None, but that doesn't seem possible with mypy.)

    When called, this will proxy the function's arguments
    to a Celery worker.

    In order for this to work, the original function must
    have been registered as a Celery task that ignores its
    result.

    Note that if Celery has been configured with
    `TASK_ALWAYS_EAGER`, the task will run synchronously.
    '''

    @wraps(fun)
    def wrapper(*args, **kwargs):
        from project.celery import app

        # We actually just use the function to look up
        # its task defintion; we don't actually call it,
        # because we want to maintain as much parity
        # as possible between both branches.

        task_name = f"{fun.__module__}.{fun.__name__}"
        if task_name not in app.tasks:
            # You'd think Celery would have already autodiscovered these,
            # but apparently it only does that when running workers or
            # something. Whatever.
            autodiscover_modules('tasks')
        task = app.tasks[task_name]
        assert task.ignore_result is True

        task.delay(*args, **kwargs)

    return wrapper  # type: ignore
