from csp.decorators import csp_update


embeddable_in_frontapp = csp_update(FRAME_ANCESTORS=[
    "https://*.frontapp.com",
    "https://*.frontapplication.com",
])
