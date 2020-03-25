from django.http import HttpResponse

from project import slack
from .email_verify import verify_code, VERIFY_OK


# The endpoint below is currently very temporary; we'll likely do a redirect
# from here to a view on the React front-end that provides a more
# streamlined user experience in the very near future.

def verify_email(request):
    code = request.GET.get("code", "")
    result, user = verify_code(code)
    if not user:
        return HttpResponse(
            f"Unfortunately, an error occurred and we were unable "
            f"to verify your account."
        )
    if result == VERIFY_OK:
        slack.sendmsg_async(
            f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
            f"has verified their email address!",
            is_safe=True
        )
    return HttpResponse(
        f"Thank you for verifying your email address! You may now "
        f"close this web page."
    )
