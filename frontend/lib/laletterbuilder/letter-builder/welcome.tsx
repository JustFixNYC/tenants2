import { t, Trans } from "@lingui/macro";
import React from "react";
import { Link } from "react-router-dom";
import { SimpleClearAnonymousSessionButton } from "../../forms/clear-anonymous-session-button";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { LALetterBuilderRoutes } from "../route-info";
import { assertNotNull } from "@justfixnyc/util";
import { li18n } from "../../i18n-lingui";

export const LALetterBuilderWelcome: React.FC<ProgressStepProps> = (props) => {
  return (
    <Page
      title={li18n._(t`Build your letter`)}
      className="content"
      withHeading="big"
    >
      <p>TODO: Add welcome content here. </p>
      <div className="buttons jf-two-buttons">
        <SimpleClearAnonymousSessionButton
          to={LALetterBuilderRoutes.locale.home}
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
