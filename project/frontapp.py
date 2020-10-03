from csp.decorators import csp_update


@csp_update(FRAME_ANCESTORS=[
    "https://*.frontapp.com",
    "https://*.frontapplication.com",
])
def frontapp_embedded_react_rendered_view(request):
    from frontend.views import react_rendered_view

    return react_rendered_view(request)
