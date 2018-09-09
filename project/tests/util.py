from django.http import QueryDict

from project.views import FRONTEND_QUERY_DIR


def get_frontend_queries(*filenames):
    return '\n'.join([
        (FRONTEND_QUERY_DIR / filename).read_text()
        for filename in filenames
    ])


def qdict(d=None):
    '''
    Convert the given dictionary of lists into a QueryDict, or
    return an empty QueryDict if nothing is provided.
    '''

    qd = QueryDict(mutable=True)
    if d is None:
        return qd
    for key in d:
        assert isinstance(d[key], list)
        qd.setlist(key, d[key])
    return qd
