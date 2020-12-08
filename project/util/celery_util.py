from typing import TypeVar, Callable, Any
from functools import wraps
from threading import Thread
from django.conf import settings
from django.utils.module_loading import autodiscover_modules

from .. import justfix_environment


T = TypeVar("T", bound=Callable)


def get_task_for_function(fun: Callable) -> Any:
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
        autodiscover_modules("tasks")
    return app.tasks[task_name]


def fire_and_forget_task(fun: T) -> T:
    """
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
    """

    @wraps(fun)
    def wrapper(*args, **kwargs):
        task = get_task_for_function(fun)
        assert task.ignore_result is True

        task.delay(*args, **kwargs)

    return wrapper  # type: ignore


def threaded_fire_and_forget_task(fun: T) -> T:
    """
    Like fire_and_forget_task(), but if Celery support is disabled, the
    function is run asynchronously in a separate thread.

    Note that ideally, in production, Celery support should actually
    be enabled, as spawning a worker thread in a process that serves
    web requests isn't recommended.
    """

    celery_wrapper = fire_and_forget_task(fun)

    @wraps(fun)
    def threaded_wrapper(*args, **kwargs):
        if settings.CELERY_BROKER_URL or justfix_environment.IS_RUNNING_TESTS:
            celery_wrapper(*args, **kwargs)
        else:
            thread = Thread(target=celery_wrapper, args=args, kwargs=kwargs)
            thread.start()

    return threaded_wrapper  # type: ignore
