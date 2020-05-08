from django.urls import path, reverse
from django.http import Http404, HttpResponseRedirect
from django.template.response import TemplateResponse
from django.contrib.auth.decorators import permission_required
from django.contrib.admin.helpers import AdminForm
from django import forms

from users.models import JustfixUser, ADD_SERVING_PAPERS_PERMISSION
from . import models


class ServingPapersForm(forms.ModelForm):
    class Meta:
        model = models.ServingPapers
        fields = [
            'name',
            'primary_line',
            'secondary_line',
            'urbanization',
            'city',
            'state',
            'zip_code',
            'pdf_file',
        ]


class HPActionAdminViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path(
                'serving-papers/create/<int:userid>/',
                # TODO: Use a different permission
                self.view_with_perm(self.create_serving_papers,
                                    ADD_SERVING_PAPERS_PERMISSION),
                name='create-serving-papers'
            ),
        ]

    def view_with_perm(self, view_func, perm: str):
        return self.site.admin_view(permission_required(perm)(view_func))

    def create_serving_papers(self, request, userid):
        sender = JustfixUser.objects.filter(pk=userid).first()
        if not (sender and
                hasattr(sender, 'onboarding_info') and
                hasattr(sender, 'landlord_details')):
            raise Http404("User not found and/or lacks required information")

        go_back_href = reverse('admin:hpaction_hpuser_change', args=(sender.pk,))

        ld = sender.landlord_details

        if request.method == "POST":
            form = ServingPapersForm(request.POST, request.FILES)
            if form.is_valid():
                sp = form.save(commit=False)
                sp.uploaded_by = request.user
                sp.sender = sender
                sp.save()
                return HttpResponseRedirect(go_back_href)
        else:
            form = ServingPapersForm(initial={
                'name': ld.name,
                'primary_line': ld.primary_line,
                'secondary_line': ld.secondary_line,
                'urbanization': ld.urbanization,
                'city': ld.city,
                'state': ld.state,
                'zip_code': ld.zip_code,
            })

        # This makes it easier to manually test the form.
        form.use_required_attribute = False

        # http://www.dmertl.com/blog/?p=116
        fieldsets = [(None, {'fields': form.base_fields})]
        adminform = AdminForm(form, fieldsets, {})

        ctx = {
            **self.site.each_context(request),
            'sender': sender,
            'form': form,
            'adminform': adminform,
            'go_back_href': go_back_href,
        }

        return TemplateResponse(
            request,
            "hpaction/admin/create-serving-papers.html",
            ctx
        )
