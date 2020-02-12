from django.conf import settings


class RapidproAnalyticsRouter:
    """
    A router to control all database operations on models in the
    rapidpro_analytics application.
    """

    route_app_labels = {'rapidpro_analytics'}

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return settings.RAPIDPRO_ANALYTICS_DATABASE
        return None

    db_for_write = db_for_read

    # Note that we would also prefer to only have tables for this
    # model exist on the relevant database, but it seems like
    # Django still stores metadata about migrations for all models
    # on all databases, even if it doesn't actually migrate any
    # schemas, which makes things very complicated and weird,
    # so we're not going to bother defining `allow_migrate()` and
    # will instead just allow this app's tables to exist on
    # all databases.
