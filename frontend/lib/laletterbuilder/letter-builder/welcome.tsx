import React from "react";
import { Link } from "react-router-dom";

import { assertNotNull } from "@justfixnyc/util";
import { Trans, t } from "@lingui/macro";

import { SimpleClearAnonymousSessionButton } from "../../forms/clear-anonymous-session-button";
import { li18n } from "../../i18n-lingui";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { LaLetterBuilderRouteInfo } from "../route-info";

export const LaLetterBuilderWelcome: React.FC<ProgressStepProps> = (props) => {
  return (
    <Page
      title={li18n._(t`Build your letter`)}
      className="content"
      withHeading="big"
    >
      <p>TODO: Add welcome content here. </p>
      <div className="buttons jf-two-buttons">
        <SimpleClearAnonymousSessionButton
          to={LaLetterBuilderRouteInfo.locale.home}
        />
        <Link
          to={assertNotNull(props.nextStep)}
          className="button jf-is-next-button is-primary is-medium"
        >
          <Trans>Next</Trans>
        </Link>
      </div>
    </Page>
  );
};
