# Ugh, we've always wanted this package to be importable without requiring
# any dependencies, but Celery really wants us to import our app here, so
# we're going to compromise by first checking to see if Celery is even
# available. If it is, we'll go ahead and import our app, otherwise we
# won't.
#
# Sigh.

_celery_available = True

try:
    import celery  # NOQA
except ModuleNotFoundError:
    _celery_available = False

if _celery_available:
    from .celery import app as celery_app

    __all__ = ("celery_app",)
