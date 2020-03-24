from django.http import HttpResponse

from .email_verify import verify_code


def verify_email(request):
    code = request.GET.get("code", "")
    user = verify_code(code)
    if isinstance(user, str):
        return HttpResponse(f"ERROR: {user}")
    return HttpResponse(f"YAY {user.full_name} IS NOW VERIFIED!")
