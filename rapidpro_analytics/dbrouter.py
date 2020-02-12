from django.conf import settings


class ReadAndWriteToRapidproAnalyticsDb:
    """
    A Django database router to control all database operations on models in the
    rapidpro_analytics application.
    """

    route_app_labels = {'rapidpro_analytics'}

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return settings.RAPIDPRO_ANALYTICS_DATABASE
        return None

    db_for_write = db_for_read
