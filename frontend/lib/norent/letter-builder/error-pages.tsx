import React from "react";
import { NorentRoutes } from "../route-info";
import { CenteredPrimaryButtonLink } from "../../ui/buttons";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { NorentCannotSendMoreLettersText } from "./more-letters";
import {
  AlreadyLoggedInErrorPage,
  ErrorPage,
  NotLoggedInErrorPage,
} from "../../common-steps/error-pages";

const getLbRoutes = () => NorentRoutes.locale.letter;

export const NorentNotLoggedInErrorPage: React.FC<{}> = () => (
  <NotLoggedInErrorPage loginUrl={getLbRoutes().phoneNumber} />
);

export const NorentAlreadySentLetterErrorPage: React.FC<{}> = () => (
  <ErrorPage title={li18n._(t`You can't send any more letters`)}>
    <NorentCannotSendMoreLettersText />
    <p>
      <Trans>
        Continue to the confirmation page for information about the last letter
        you sent and next steps you can take.
      </Trans>
    </p>
    <br />
    <CenteredPrimaryButtonLink to={getLbRoutes().confirmation}>
      <Trans>Continue</Trans>
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);

export const NorentAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <AlreadyLoggedInErrorPage continueUrl={getLbRoutes().latestStep} />
);
