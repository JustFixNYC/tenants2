from django.core.management.base import BaseCommand
from django.db.models.expressions import Col
from django.contrib.auth.models import AnonymousUser

from evictionfree.admin_data_downloads import execute_evictionfree_users_query
from users.models import JustfixUser


EXTRA_DOCS = {
    JustfixUser._meta.get_field(
        "id"
    ): "The user's unique id. Can be useful in joining with other data sets.",
    JustfixUser._meta.get_field("date_joined"): "The date the user's account was created.",
    JustfixUser._meta.get_field("first_name"): "The user's first name.",
    JustfixUser._meta.get_field("last_name"): "The user's last name.",
    JustfixUser._meta.get_field("email"): "The user's email address.",
}


def get_docs(target):
    return EXTRA_DOCS.get(target) or target.help_text


class Command(BaseCommand):
    help = "Show data dictionary."

    def handle(self, *args, **options):
        qs = execute_evictionfree_users_query.get_queryset(AnonymousUser())

        for col in qs.query.select:
            print(f"* {col.target.name}: {get_docs(col.target)}")

        for anno, col in qs.query.annotations.items():
            if isinstance(col, Col):
                help_text = get_docs(col.target)
            else:
                help_text = f"Don't know how to get docs for {col}."
            print(f"* {anno}: {help_text}")
