import React from "react";
import { Link } from "react-router-dom";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { EvictionFreeRoutes } from "../route-info";

export const EvictionFreeDbConfirmation: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <p>
      TODO: Add confirmation content here.{" "}
      <Link to={EvictionFreeRoutes.locale.home}>Back to homepage</Link>
    </p>
  );
};
