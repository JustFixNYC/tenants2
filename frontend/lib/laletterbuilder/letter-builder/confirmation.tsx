import React from "react";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { Link } from "react-router-dom";

export const LaLetterBuilderConfirmation: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page title="Confirmation" withHeading="big" className="content">
      <p>You've sent your letter!</p>
      <Link to={LaLetterBuilderRouteInfo.locale.letter.chooseLetter}></Link>
    </Page>
  );
};
