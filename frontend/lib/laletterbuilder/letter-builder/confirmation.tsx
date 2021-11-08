import React from "react";
import { Link } from "react-router-dom";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { LALetterBuilderRoutes } from "../route-info";

export const LALetterBuilderConfirmation: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <p>
      TODO: Add confirmation content here.{" "}
      <Link to={LALetterBuilderRoutes.locale.home}>Back to homepage</Link>
    </p>
  );
};
