from django.contrib.auth.decorators import permission_required
from django.template.response import TemplateResponse
from django.utils import timezone
from django.urls import path, reverse
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect
from django import forms
from django.contrib import messages
from django.core import signing
from django.contrib.admin.models import LogEntry, CHANGE, DELETION
from django.contrib.contenttypes.models import ContentType

from users.models import CHANGE_LETTER_REQUEST_PERMISSION
import airtable.sync
from project import slack
from . import models, views, lob_api


class RejectLetterForm(forms.Form):
    rejection_reason = forms.ChoiceField(
        choices=[("", "(Please choose a reason)")] + models.LOC_REJECTION_CHOICES.choices
    )


def get_ll_addr_details_url(landlord_details: models.LandlordDetails) -> str:
    ad = landlord_details.get_or_create_address_details_model()
    return reverse("admin:loc_addressdetails_change", args=(ad.pk,))


class LocAdminViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path(
                "lob/<int:letterid>/",
                self.view_with_perm(self.mail_via_lob, CHANGE_LETTER_REQUEST_PERMISSION),
                name="mail-via-lob",
            ),
            path(
                "reject/<int:letterid>/",
                self.view_with_perm(self.reject_letter, CHANGE_LETTER_REQUEST_PERMISSION),
                name="reject-letter",
            ),
        ]

    def view_with_perm(self, view_func, perm: str):
        return self.site.admin_view(permission_required(perm)(view_func))

    def _get_mail_confirmation_context(self, user):
        landlord_details = user.landlord_details
        onboarding_info = user.onboarding_info
        ll_addr_details = landlord_details.get_or_create_address_details_model()

        landlord_verification = lob_api.verify_address(**ll_addr_details.as_lob_params())
        user_verification = lob_api.verify_address(**onboarding_info.as_lob_params())

        return self._create_mail_confirmation_context(
            landlord_verification=landlord_verification,
            user_verification=user_verification,
            is_manually_overridden=ll_addr_details.is_definitely_deliverable,
        )

    def _create_mail_confirmation_context(
        self, landlord_verification, user_verification, is_manually_overridden: bool
    ):
        is_deliverable = (
            landlord_verification["deliverability"] != lob_api.UNDELIVERABLE
            or is_manually_overridden
        )

        is_definitely_deliverable = (
            landlord_verification["deliverability"] == lob_api.DELIVERABLE
            and user_verification["deliverability"] == lob_api.DELIVERABLE
        )

        verifications = {
            "landlord_verification": landlord_verification,
            "landlord_verified_address": lob_api.get_address_from_verification(
                landlord_verification
            ),
            "landlord_deliverability_docs": lob_api.get_deliverability_docs(landlord_verification),
            "user_verification": user_verification,
            "user_verified_address": lob_api.get_address_from_verification(user_verification),
            "user_deliverability_docs": lob_api.get_deliverability_docs(user_verification),
            "is_deliverable": is_deliverable,
            "is_definitely_deliverable": is_definitely_deliverable,
            "is_manually_overridden": is_manually_overridden,
        }

        return {"signed_verifications": signing.dumps(verifications), **verifications}

    def _log_letter_action(self, request, letter, message: str, action: int):
        LogEntry.objects.log_action(
            user_id=request.user.id,
            content_type_id=ContentType.objects.get_for_model(models.LetterRequest).pk,
            object_id=letter.pk,
            object_repr=str(letter),
            action_flag=action,
            change_message=message,
        )

    def _create_letter(self, request, letter, verifications):
        user = letter.user
        pdf_file = views.render_finished_loc_pdf_for_user(request, user).file_to_stream
        response = lob_api.mail_certified_letter(
            description="Letter of complaint",
            to_address={
                "name": user.landlord_details.name,
                **lob_api.verification_to_inline_address(verifications["landlord_verification"]),
            },
            from_address={
                "name": letter.user.full_name,
                **lob_api.verification_to_inline_address(verifications["user_verification"]),
            },
            file=pdf_file,
            color=False,
            double_sided=False,
        )
        return response

    def mail_via_lob(self, request, letterid):
        from .admin import get_lob_nomail_reason

        letter = get_object_or_404(models.LetterRequest, pk=letterid)
        user = letter.user
        lob_nomail_reason = get_lob_nomail_reason(letter)
        is_post = request.method == "POST"
        ctx = {
            **self.base_letter_context(request, letter),
            "title": "Mail letter of complaint via Lob",
            "lob_nomail_reason": lob_nomail_reason,
            "is_post": is_post,
        }

        if not lob_nomail_reason:
            if is_post:
                verifications = signing.loads(request.POST["signed_verifications"])
                response = self._create_letter(request, letter, verifications)
                letter.lob_letter_object = response
                letter.tracking_number = response["tracking_number"]
                letter.letter_sent_at = timezone.now()
                letter.save()
                self._log_letter_action(request, letter, "Mailed the letter via Lob.", CHANGE)
                airtable.sync.sync_user(user)
                slack.sendmsg_async(
                    f"{slack.escape(request.user.first_name)} has sent "
                    f"{slack.hyperlink(text=user.first_name, href=user.admin_url)}'s "
                    "letter of complaint!",
                    is_safe=True,
                )
            else:
                ctx.update(
                    {
                        **self._get_mail_confirmation_context(user),
                        "landlord_address_details_url": get_ll_addr_details_url(
                            user.landlord_details
                        ),
                    }
                )

        return TemplateResponse(request, "loc/admin/lob.html", ctx)

    def base_letter_context(self, request, letter):
        user = letter.user
        return {
            **self.site.each_context(request),
            "user": user,
            "letter": letter,
            "go_back_href": reverse("admin:loc_locuser_change", args=(user.pk,)),
            "pdf_url": user.letter_request.admin_pdf_url,
        }

    def reject_letter(self, request, letterid):
        from .admin import get_reason_for_not_rejecting_or_mailing

        letter = get_object_or_404(models.LetterRequest, pk=letterid)
        noreject_reason = get_reason_for_not_rejecting_or_mailing(letter)

        ctx = {
            **self.base_letter_context(request, letter),
            "noreject_reason": noreject_reason,
            "title": "Reject letter",
        }

        if not noreject_reason:
            if request.method == "POST":
                form = RejectLetterForm(data=request.POST)
                if form.is_valid():
                    letter.rejection_reason = form.cleaned_data["rejection_reason"]
                    letter.archive()
                    self._log_letter_action(request, letter, "Rejected the letter.", DELETION)
                    messages.success(
                        request, "The user's letter request was rejected successfully."
                    )
                    return HttpResponseRedirect(ctx["go_back_href"])
                else:
                    messages.error(
                        request, "There was an error in your form submission!  See below."
                    )
            else:
                form = RejectLetterForm()
            ctx["form"] = form

        return TemplateResponse(request, "loc/admin/reject_letter.html", ctx)
