import { t } from "@lingui/macro";
import React from "react";
import { li18n } from "../../i18n-lingui";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import Page from "../../ui/page";

export const LaLetterBuilderSendOptions = MiddleProgressStep((props) => {
  return (
    <Page
      title={li18n._(t`Would you like us to send the letter for you for free?`)}
      withHeading="big"
      className="content"
    >
      <hr />
      <p>
        <b>Send for me</b>
        <br />
        We'll send your letter for you via certified mail in 1-2 business days,
        at no cost to you.
      </p>
      <hr />
      <p>
        <b>Download and send myself</b>
      </p>
      <p>
        Not sure yet? If you need more time to decide, you can always come back
        later. We've saved your work.
      </p>
      <ProgressButtonsAsLinks back={props.prevStep} next={props.nextStep} />{" "}
    </Page>
  );
});
