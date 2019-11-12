from django.contrib.auth.decorators import permission_required
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.shortcuts import get_object_or_404
from django.core import signing

from users.models import CHANGE_LETTER_REQUEST_PERMISSION
from . import models, views, lob_api


def get_ll_addr_details(landlord_details: models.LandlordDetails) -> models.AddressDetails:
    return models.AddressDetails.objects.get_or_create(
        address=landlord_details.address)[0]


def get_ll_addr_details_url(landlord_details: models.LandlordDetails) -> str:
    ad = get_ll_addr_details(landlord_details)
    return reverse('admin:loc_addressdetails_change', args=(ad.pk,))


class LocAdminViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path('lob/<int:letterid>/',
                 self.view_with_perm(self.mail_via_lob, CHANGE_LETTER_REQUEST_PERMISSION),
                 name='mail-via-lob'),
        ]

    def view_with_perm(self, view_func, perm: str):
        return self.site.admin_view(permission_required(perm)(view_func))

    def _get_mail_confirmation_context(self, user):
        landlord_details = user.landlord_details
        onboarding_info = user.onboarding_info
        ll_addr_details = get_ll_addr_details(landlord_details)

        landlord_verification = lob_api.verify_address(**ll_addr_details.as_lob_params())
        user_verification = lob_api.verify_address(
            primary_line=onboarding_info.address,
            secondary_line=onboarding_info.apartment_address_line,
            state=onboarding_info.state,
            city=onboarding_info.city,
            zip_code=onboarding_info.zipcode,
        )

        return self._create_mail_confirmation_context(
            landlord_verification=landlord_verification,
            user_verification=user_verification,
            is_manually_overridden=ll_addr_details.is_definitely_deliverable
        )

    def _create_mail_confirmation_context(
        self,
        landlord_verification,
        user_verification,
        is_manually_overridden: bool
    ):
        is_deliverable = (
            landlord_verification['deliverability'] != lob_api.UNDELIVERABLE or
            is_manually_overridden
        )

        is_definitely_deliverable = (
            landlord_verification['deliverability'] == lob_api.DELIVERABLE and
            user_verification['deliverability'] == lob_api.DELIVERABLE
        )

        verifications = {
            'landlord_verification': landlord_verification,
            'landlord_verified_address': lob_api.get_address_from_verification(
                landlord_verification),
            'landlord_deliverability_docs': lob_api.get_deliverability_docs(
                landlord_verification),
            'user_verification': user_verification,
            'user_verified_address': lob_api.get_address_from_verification(user_verification),
            'user_deliverability_docs': lob_api.get_deliverability_docs(user_verification),
            'is_deliverable': is_deliverable,
            'is_definitely_deliverable': is_definitely_deliverable,
            'is_manually_overridden': is_manually_overridden
        }

        return {
            'signed_verifications': signing.dumps(verifications),
            **verifications
        }

    def _create_letter(self, request, letter, verifications):
        user = letter.user
        pdf_file = views.render_letter_of_complaint(request, user, 'pdf').file_to_stream
        response = lob_api.mail_certified_letter(
            description='Letter of complaint',
            to_address={
                'name': user.landlord_details.name,
                **lob_api.verification_to_inline_address(verifications['landlord_verification'])
            },
            from_address={
                'name': letter.user.full_name,
                **lob_api.verification_to_inline_address(verifications['user_verification'])
            },
            file=pdf_file,
            color=False,
            double_sided=False
        )
        return response

    def mail_via_lob(self, request, letterid):
        from .admin import get_lob_nomail_reason

        letter = get_object_or_404(models.LetterRequest, pk=letterid)
        user = letter.user
        lob_nomail_reason = get_lob_nomail_reason(letter)
        is_post = request.method == "POST"
        ctx = {
            **self.site.each_context(request),
            'title': "Mail letter of complaint via Lob",
            'user': user,
            'letter': letter,
            'lob_nomail_reason': lob_nomail_reason,
            'is_post': is_post,
            'pdf_url': user.letter_request.admin_pdf_url,
            'go_back_href': reverse('admin:users_justfixuser_change', args=(user.pk,)),
        }

        if not lob_nomail_reason:
            if is_post:
                verifications = signing.loads(request.POST['signed_verifications'])
                response = self._create_letter(request, letter, verifications)
                letter.lob_letter_object = response
                letter.tracking_number = response['tracking_number']
                letter.save()
            else:
                ctx.update({
                    **self._get_mail_confirmation_context(user),
                    'landlord_address_details_url': get_ll_addr_details_url(user.landlord_details)
                })

        return TemplateResponse(request, "loc/admin/lob.html", ctx)
