import { t, Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { Link, Redirect } from "react-router-dom";
import { AppContext } from "../../app-context";
import { li18n } from "../../i18n-lingui";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { friendlyDate } from "../../util/date-util";
import { assertNotNull } from "../../util/util";
import { NorentRoutes } from "../routes";
import { hasNorentLetterBeenSentForAllRentPeriods } from "./step-decorators";
import { NorentMoreLettersBlurb } from "./more-letters";

export const NorentMenu: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);

  if (hasNorentLetterBeenSentForAllRentPeriods(session)) {
    // Skip this page; there's no menu to present the user with,
    // since it will only have one option, as the user can't
    // send any more letters.
    return <Redirect to={assertNotNull(props.nextStep)} />;
  }
  const { norentLatestLetter } = session;
  if (!norentLatestLetter) {
    // Not sure how the user got here, but they don't belong here;
    // go back!
    return <Redirect to={assertNotNull(props.prevStep)} />;
  }
  return (
    <Page
      title={li18n._(t`Welcome back!`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans>
          You most recently sent a letter on{" "}
          {friendlyDate(new Date(norentLatestLetter.createdAt))}.
        </Trans>
      </p>
      <p className="has-text-centered">
        <Link
          to={NorentRoutes.locale.letter.confirmation}
          className="button is-primary is-large jf-is-extra-wide"
        >
          <Trans>View details about your last letter</Trans>
        </Link>
      </p>
      <br />
      <NorentMoreLettersBlurb />
    </Page>
  );
};
