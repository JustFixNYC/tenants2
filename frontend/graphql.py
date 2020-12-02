from pathlib import Path
from typing import List, Dict, Any

import re

MY_DIR = Path(__file__).parent.resolve()

FRONTEND_QUERY_DIR = MY_DIR / "lib" / "queries" / "autogen"


def find_all_graphql_fragments(query: str) -> List[str]:
    """
    >>> find_all_graphql_fragments('blah')
    []
    >>> find_all_graphql_fragments('query { ...Thing,\\n ...OtherThing }')
    ['Thing', 'OtherThing']
    """

    results = re.findall(r"\.\.\.([A-Za-z0-9_]+)", query)
    return [thing for thing in results]


def add_graphql_fragments(query: str) -> str:
    all_graphql = [query]
    to_find = find_all_graphql_fragments(query)

    while to_find:
        fragname = to_find.pop()
        fragpath = FRONTEND_QUERY_DIR / f"{fragname}.graphql"
        fragtext = fragpath.read_text()
        to_find.extend(find_all_graphql_fragments(fragtext))
        all_graphql.append(fragtext)

    return "\n".join(all_graphql)


def execute_query(request, query: str, variables=None) -> Dict[str, Any]:
    # We're importing this in this function to avoid a circular
    # imports by code that needs to import this module.
    from project.schema import schema

    result = schema.execute(query, context=request, variables=variables)
    if result.errors:
        raise Exception(result.errors)
    return result.data


def get_initial_session(request) -> Dict[str, Any]:
    data = execute_query(
        request,
        add_graphql_fragments(
            """
        query GetInitialSession {
            session {
                ...AllSessionInfo
            }
        }
        """
        ),
    )
    return data["session"]
