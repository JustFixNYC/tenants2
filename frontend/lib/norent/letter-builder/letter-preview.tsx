import React from "react";
import Page from "../../ui/page";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { LetterPreview } from "../../static-page/letter-preview";
import { NorentRoutes } from "../routes";
import { ProgressButtons } from "../../ui/buttons";
import { OutboundLink } from "../../analytics/google-analytics";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentSendLetterMutation } from "../../queries/NorentSendLetterMutation";

export const NorentLetterPreviewPage = MiddleProgressStep((props) => {
  const { letterContent } = NorentRoutes.locale;

  return (
    <Page title="Almost there!" withHeading="big" className="content">
      <p>
        Before you send your letter, let's review what will be sent to make sure
        all the information is correct.
      </p>
      <p>Here's a preview of the letter.</p>
      <LetterPreview
        title="Preview of your NoRent.org letter"
        src={letterContent.html}
      />
      <p>
        You can also{" "}
        <OutboundLink href={letterContent.pdf} target="_blank">
          view this letter as a PDF
        </OutboundLink>
        .
      </p>
      <SessionUpdatingFormSubmitter
        mutation={NorentSendLetterMutation}
        initialState={{}}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <ProgressButtons
            isLoading={ctx.isLoading}
            back={props.prevStep}
            nextLabel="Send letter"
          />
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
