import { Trans } from "@lingui/macro";
import React from "react";
import { Link } from "react-router-dom";
import { SimpleClearSessionButton } from "../../forms/clear-session-button";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { assertNotNull } from "../../util/util";
import { EvictionFreeRoutes } from "../route-info";

export const EvictionFreeDbWelcome: React.FC<ProgressStepProps> = (props) => {
  return (
    <p>
      TODO: Add welcome content here.{" "}
      <div className="buttons jf-two-buttons">
        <SimpleClearSessionButton to={EvictionFreeRoutes.locale.home} />
        <Link
          to={assertNotNull(props.nextStep)}
          className="button jf-is-next-button is-primary is-medium"
        >
          <Trans>Next</Trans>
        </Link>
      </div>
    </p>
  );
};
