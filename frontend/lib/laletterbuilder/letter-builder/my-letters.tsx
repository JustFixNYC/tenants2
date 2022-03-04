import React from "react";
import { Link } from "react-router-dom";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { li18n } from "../../i18n-lingui";
import { t } from "@lingui/macro";

export const LaLetterBuilderMyLetters: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page title="My letters" withHeading="big" className="content">
      <p>Your Letters</p>
      <div>
        <Link
          // TODO: this currently always goes to /phone/ask, make it not do that if the user is logged in
          to={LaLetterBuilderRouteInfo.locale.habitability.latestStep}
          className="button jf-is-next-button is-primary is-medium"
        >
          {li18n._(t`Start a habitability letter`)}
        </Link>
      </div>
    </Page>
  );
};
