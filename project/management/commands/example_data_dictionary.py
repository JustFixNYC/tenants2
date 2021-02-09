from django.core.management.base import BaseCommand
from django.contrib.auth.models import AnonymousUser

from evictionfree.admin_data_downloads import execute_evictionfree_users_query
from project.util import data_dictionary


class Command(BaseCommand):
    help = "Show data dictionary."

    def handle(self, *args, **options):
        qs = execute_evictionfree_users_query.get_queryset(AnonymousUser())

        docs = data_dictionary.get_data_dictionary(qs)
        for field_name, help_text in docs.items():
            print(f"* {field_name}: {help_text}")
