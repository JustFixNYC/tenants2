from project.views import FRONTEND_QUERY_DIR


def get_frontend_queries(*filenames):
    return '\n'.join([
        (FRONTEND_QUERY_DIR / filename).read_text()
        for filename in filenames
    ])
