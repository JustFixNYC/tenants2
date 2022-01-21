import React from "react";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";

export const LaLetterBuilderConfirmation: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page title="My letters" withHeading="big" className="content">
      <p>You've sent your letter!</p>
      <p>Letter Timeline...</p>
    </Page>
  );
};
