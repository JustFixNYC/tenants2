from typing import NamedTuple, Dict, Any, Optional
from django.utils.safestring import SafeString


class GraphQLQueryPrefetchInfo(NamedTuple):
    """
    Encapsulates details from the server-side renderer
    about a GraphQL query that should (ideally) be
    pre-fetched for the current request.
    """

    graphql: str
    input: Any


class LambdaResponse(NamedTuple):
    """
    Encapsulates the result of the server-side renderer.

    This is more or less the same as the LambdaResponse
    interface defined in frontend/lambda/lambda.tsx.
    """

    html: SafeString
    is_static_content: bool
    http_headers: Dict[str, str]
    title_tag: SafeString
    meta_tags: SafeString
    script_tags: SafeString
    status: int
    modal_html: SafeString
    location: Optional[str]
    traceback: Optional[str]
    graphql_query_to_prefetch: Optional[GraphQLQueryPrefetchInfo]

    # The amount of time rendering took, in milliseconds.
    render_time: int
