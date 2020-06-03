from frontend.graphql import FRONTEND_QUERY_DIR, add_graphql_fragments


def get_frontend_query(filename) -> str:
    query = (FRONTEND_QUERY_DIR / filename).read_text()
    return add_graphql_fragments(query)
