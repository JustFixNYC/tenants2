import { t, Trans } from "@lingui/macro";
import React from "react";
import { li18n } from "../../i18n-lingui";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { TextualFormField, RadiosFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import {
  BlankLaLetterBuilderSendOptionsInput,
  LaLetterBuilderSendOptionsMutation,
} from "../../queries/LaLetterBuilderSendOptionsMutation";
import {
  LaMailingChoice,
  LaMailingChoices,
  getLaMailingChoiceLabels,
} from "../../../../common-data/laletterbuilder-mailing-choices";
import { toDjangoChoices } from "../../common-data";
import Page from "../../ui/page";
import { optionalizeLabel } from "../../forms/optionalize-label";

export const LaLetterBuilderSendOptions = MiddleProgressStep((props) => {
  return (
    <Page
      title={li18n._(t`Would you like us to send the letter for you for free?`)}
      withHeading="big"
      className="content"
    >
      <SessionUpdatingFormSubmitter
        mutation={LaLetterBuilderSendOptionsMutation}
        initialState={(s) => ({
          mailChoice: "WE_WILL_MAIL" as LaMailingChoice,
          email: s.landlordDetails?.email || "",
        })}
        onSuccessRedirect={() => props.nextStep}
      >
        {(ctx) => (
          <>
            <hr />
            <RadiosFormField
              {...ctx.fieldPropsFor("mailChoice")}
              choices={toDjangoChoices(
                LaMailingChoices,
                getLaMailingChoiceLabels()
              )}
              label={li18n._(t`Select a mailing method`)}
            />
            <p>
              <b>
                <Trans>Send for me</Trans>
              </b>
              <br />
              <Trans>
                We'll send your letter for you via certified mail in 1-2
                business days, at no cost to you.
              </Trans>
            </p>
            <hr />
            <p>
              <b>
                <Trans>Download and send myself</Trans>
              </b>
            </p>
            <p>
              <Trans>
                Not sure yet? If you need more time to decide, you can always
                come back later. We've saved your work.
              </Trans>
            </p>
            <TextualFormField
              type="email"
              {...ctx.fieldPropsFor("email")}
              label={optionalizeLabel(
                li18n._(t`Landlord/management company's email`)
              )}
            />
            <ProgressButtonsAsLinks
              back={props.prevStep}
              next={props.nextStep}
            />{" "}
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
