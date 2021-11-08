import React from "react";
import { Link } from "react-router-dom";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { assertNotNull } from "@justfixnyc/util";

export const LALetterBuilderWelcome: React.FC<ProgressStepProps> = (props) => {
  return (
    <p>
      TODO: Add welcome content here.{" "}
      <Link to={assertNotNull(props.nextStep)}>Next</Link>
    </p>
  );
};
