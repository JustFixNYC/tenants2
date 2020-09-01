import React from "react";
import { LegacyFormSubmitter } from "./legacy-form-submitter";
import { PageTitle } from "../ui/page";
import { Formset } from "./formset";
import { TextualFormField } from "./form-fields";
import { NextButton } from "../ui/buttons";
import eav from "../../../common-data/email-attachment-validation.json";
import { FetchMutationInfo } from "./forms-graphql";
import { WithServerFormFieldErrors } from "./form-errors";
import { DemoDeploymentNote } from "../ui/demo-deployment-note";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";

// https://github.com/lingui/js-lingui/issues/514
const { maxRecipients } = eav;

type Recipient = {
  email: string;
};

type EmailAttachmentInput = {
  recipients: Recipient[];
};

type EmailAttachmentOutput = WithServerFormFieldErrors & {
  recipients: string[] | null;
};

export type EmailAttachmentFormProps = {
  mutation: FetchMutationInfo<EmailAttachmentInput, EmailAttachmentOutput>;
  noun: string;
};

const EMPTY_FORM: EmailAttachmentInput = { recipients: [] };

function labelForRecipient(i: number): string {
  const label = li18n._(t`Email address for recipient #${i + 1}`);
  return i === 0 ? label : `${label} ` + li18n._(t`(optional)`);
}

function SuccessMessage(props: { text: string }) {
  return (
    <div className="notification is-success jf-fadein-half-second">
      {props.text}
      <PageTitle title={props.text} />
    </div>
  );
}

export function EmailAttachmentForm(props: EmailAttachmentFormProps) {
  const { noun } = props;

  return (
    <LegacyFormSubmitter
      /* Browser validation of email addresses is unfriendly, but we want email-specific
       * keyboards on mobile devices, so we'll use type="email" but disable validation. */
      extraFormAttributes={{ noValidate: true }}
      mutation={props.mutation}
      initialState={EMPTY_FORM}
    >
      {(ctx, latestOutput) => {
        const wasSentTo = latestOutput && latestOutput.recipients;
        return (
          <>
            {wasSentTo && (
              <SuccessMessage
                text={
                  li18n._(t`Got it! We're sending your ${noun} to`) +
                  ` ${wasSentTo.join(", ")}.`
                }
              />
            )}
            <div className={wasSentTo ? "is-hidden" : ""}>
              <p>
                <Trans>
                  You can use the form below if you'd like us to email your{" "}
                  {noun} to up to {maxRecipients} addresses.
                </Trans>
              </p>
              <DemoDeploymentNote>
                <p>
                  <Trans>
                    Using this form <strong>will send</strong> real e-mails.
                  </Trans>
                </p>
              </DemoDeploymentNote>
              <Formset
                {...ctx.formsetPropsFor("recipients")}
                maxNum={maxRecipients}
                emptyForm={{ email: "" }}
                extra={maxRecipients}
              >
                {(formsetCtx, i) => (
                  <TextualFormField
                    {...formsetCtx.fieldPropsFor("email")}
                    type="email"
                    label={labelForRecipient(i)}
                  />
                )}
              </Formset>
              <NextButton
                isLoading={ctx.isLoading}
                label={`Email ${noun}`}
                buttonClass="is-light"
              />
            </div>
          </>
        );
      }}
    </LegacyFormSubmitter>
  );
}
