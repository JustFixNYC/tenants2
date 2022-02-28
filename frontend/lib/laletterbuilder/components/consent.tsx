import { t } from "@lingui/macro";
import React from "react";
import { li18n } from "../../i18n-lingui";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import Page from "../../ui/page";
import { LaLetterBuilderOnboardingStep } from "../letter-builder/step-decorators";

export const LaLetterBuilderRiskConsent = LaLetterBuilderOnboardingStep(
  (props) => {
    return (
      <Page
        title={li18n._(
          t`Learn about common situations where sending a letter may not be helpful`
        )}
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
  }
);
