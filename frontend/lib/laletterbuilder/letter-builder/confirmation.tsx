import React from "react";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";

export const LALetterBuilderConfirmation: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page
      title="Placeholder confirmation page"
      withHeading="big"
      className="content"
    >
      <p>TODO: Add confirmation content here.</p>
    </Page>
  );
};
