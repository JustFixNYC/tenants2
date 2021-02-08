from .admin_download_data import DataDownload, queryset_data_download
from users.models import CHANGE_USER_PERMISSION, JustfixUser


@queryset_data_download
def execute_users_query(user):
    return JustfixUser.objects.values(
        "id",
        "date_joined",
    )


DATA_DOWNLOADS = [
    DataDownload(
        name="Sandefur user data",
        slug="sandefur-user-data",
        html_desc="Details about users for Rebecca Sandefur",
        perms=[CHANGE_USER_PERMISSION],
        execute_query=execute_users_query,
    ),
]
