from typing import List, Optional
from graphql import ResolveInfo
import graphene
from django import forms
from django.http import FileResponse
from django.core.mail import EmailMultiAlternatives

from users.models import JustfixUser
from project import common_data, slack
from project.util.django_graphql_forms import DjangoFormMutation

MAX_RECIPIENTS = common_data.load_json("email-attachment-validation.json")["maxRecipients"]


def email_file_response_as_attachment(
    subject: str,
    body: str,
    recipients: List[str],
    attachment: FileResponse,
    html_body: Optional[str] = None,
) -> None:
    attachment_bytes = attachment.getvalue()

    for recipient in recipients:
        msg = EmailMultiAlternatives(subject=subject, body=body, to=[recipient])
        if html_body:
            msg.attach_alternative(html_body, "text/html")
        msg.attach(attachment.filename, attachment_bytes)
        msg.send()


def get_slack_notify_text(user: JustfixUser, attachment_name: str, num_recipients: int) -> str:
    return (
        f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
        f"emailed {slack.escape(attachment_name)} to {num_recipients} "
        f"recipient{'s' if num_recipients > 1 else ''}!"
    )


class EmailForm(forms.Form):
    email = forms.EmailField()


class EmailAttachmentMutation(DjangoFormMutation):
    class Meta:
        abstract = True

    attachment_name = "an attachment"

    login_required = True

    recipients = graphene.List(graphene.NonNull(graphene.String))

    @classmethod
    def __init_subclass_with_meta__(cls, *args, **kwargs):
        kwargs["formset_classes"] = {
            "recipients": forms.formset_factory(
                EmailForm, max_num=MAX_RECIPIENTS, validate_max=True, min_num=1, validate_min=True
            ),
            **kwargs.get("formset_classes", {}),
        }
        super().__init_subclass_with_meta__(*args, **kwargs)

    @classmethod
    def send_email(cls, user_id: int, recipients: List[str]) -> None:
        raise NotImplementedError("Subclasses must implement this!")

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        recipients = [f.cleaned_data["email"] for f in form.formsets["recipients"]]
        cls.send_email(user.pk, recipients)
        slack.sendmsg_async(
            get_slack_notify_text(user, cls.attachment_name, len(recipients)), is_safe=True
        )
        return cls(errors=[], recipients=recipients)
