from django.conf import settings


class ReadAndWriteToDataWarehouseDb:
    """
    A Django database router to control all database operations on models in the
    Data Warehouse application.
    """

    route_app_labels = {"dwh"}

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return settings.DWH_DATABASE
        return None

    db_for_write = db_for_read
