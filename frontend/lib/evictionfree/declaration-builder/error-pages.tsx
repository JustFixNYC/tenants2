import { t, Trans } from "@lingui/macro";
import React from "react";
import {
  AlreadyLoggedInErrorPage,
  ErrorPage,
  NotLoggedInErrorPage,
} from "../../common-steps/error-pages";
import { li18n } from "../../i18n-lingui";
import { CenteredPrimaryButtonLink } from "../../ui/buttons";
import { EvictionFreeRoutes } from "../route-info";

export const EvictionFreeAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <AlreadyLoggedInErrorPage
    continueUrl={EvictionFreeRoutes.locale.declaration.latestStep}
  />
);

export const EvictionFreeNotLoggedInErrorPage: React.FC<{}> = () => (
  <NotLoggedInErrorPage
    loginUrl={EvictionFreeRoutes.locale.declaration.phoneNumber}
  />
);

export const EvictionFreeAlreadySentDeclarationErrorPage: React.FC<{}> = () => (
  <ErrorPage title={li18n._(t`You've already sent your hardship declaration`)}>
    <p>
      <Trans>
        Continue to the confirmation page for information about the declaration
        you sent and next steps you can take.
      </Trans>
    </p>
    <br />
    <CenteredPrimaryButtonLink
      to={EvictionFreeRoutes.locale.declaration.confirmation}
    >
      <Trans>Continue</Trans>
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);
