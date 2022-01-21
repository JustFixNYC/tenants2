import { t } from "@lingui/macro";
import React from "react";
import { li18n } from "../../i18n-lingui";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import Page from "../../ui/page";

export const LaLetterBuilderSendOptions = MiddleProgressStep((props) => {
  return (
    <Page
      title={li18n._(t`Decide how to send your letter`)}
      withHeading="big"
      className="content"
    >
      <p>Add content</p>
      <ProgressButtonsAsLinks
        back={props.prevStep}
        next={props.nextStep}
      />{" "}
    </Page>
  );
});
