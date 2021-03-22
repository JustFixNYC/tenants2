from django.urls import reverse

from frontend.graphql import FRONTEND_QUERY_DIR, add_graphql_fragments


def get_frontend_query(filename) -> str:
    query = (FRONTEND_QUERY_DIR / filename).read_text()
    return add_graphql_fragments(query)


def react_url(path: str) -> str:
    base_url = reverse("react")
    if base_url.endswith("/"):
        base_url = base_url[:-1]
    return f"{base_url}{path}"
