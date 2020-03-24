from django.http import HttpResponse

from .email_verify import verify_code


def verify_email(request):
    code = request.GET.get("code", "")
    result, user = verify_code(code)
    if not user:
        return HttpResponse(f"ERROR: {user}")
    return HttpResponse(f"YAY {user.full_name} IS NOW VERIFIED ({result})!")
