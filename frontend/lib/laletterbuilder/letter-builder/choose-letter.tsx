import React from "react";

import { t } from "@lingui/macro";

import { li18n } from "../../i18n-lingui";
import Page from "../../ui/page";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { Link } from "react-router-dom";
import { SimpleClearAnonymousSessionButton } from "../../forms/clear-anonymous-session-button";
import { LaLetterBuilderRouteInfo } from "../route-info";

export const LaLetterBuilderChooseLetterStep: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page
      title={li18n._(t`Select a letter to get started`)}
      className="content"
      withHeading="small"
    >
      <div className="buttons jf-two-buttons">
        <SimpleClearAnonymousSessionButton
          to={LaLetterBuilderRouteInfo.locale.home}
        />
        <div>
          <Link
            // TODO: this currently always goes to /phone/ask, make it not do that if the user is logged in
            to={LaLetterBuilderRouteInfo.locale.habitability.latestStep}
            className="button jf-is-next-button is-primary is-medium"
          >
            {li18n._(t`Habitability`)}
          </Link>
        </div>
      </div>
    </Page>
  );
};
