import React from "react";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { LaLetterBuilderRoutes } from "../route-info";
import { Link } from "react-router-dom";

export const LaLetterBuilderLetterRecommendation: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page title="Your Next Step" withHeading="big" className="content">
      <p>Based on what you shared, a good next step might be Habitability.</p>
      <Link to={LaLetterBuilderRoutes.locale.letter.habitability.landlordName}>
        Go to my recommended letter
      </Link>
    </Page>
  );
};
