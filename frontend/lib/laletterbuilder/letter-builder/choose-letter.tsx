import React from "react";

import { t } from "@lingui/macro";

import { toDjangoChoices } from "../../common-data";
import { li18n } from "../../i18n-lingui";
import {
  LetterChoices,
  getLetterChoiceLabels,
} from "../../../../common-data/la-letter-builder-letter-choices";
import Page from "../../ui/page";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { Link } from "react-router-dom";
import { assertNotNull } from "@justfixnyc/util";
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
            to={LaLetterBuilderRouteInfo.locale.habitability.latestStep} // TODO: make this different for each button
            className="button jf-is-next-button is-primary is-medium"
          >
            {li18n._(t`Habitability`)}
          </Link>
        </div>
      </div>
    </Page>
  );
};
