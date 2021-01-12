import React from "react";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { LogoutMutation } from "../queries/LogoutMutation";
import { NextButton } from "../ui/buttons";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import { EvictionFreeRoutes } from "./route-info";

// TODO: This is almost identical to the norent logout page, refactor into a single component.
export const EvictionFreeLogoutPage: React.FC<{}> = () => (
  <Page title={li18n._(t`Log out`)}>
    <h2 className="title">
      <Trans>Are you sure you want to log out?</Trans>
    </h2>
    <p>
      <Trans>
        Don’t worry, we’ll save your progress so you’ll be able to come back to
        your last step when you log back in.
      </Trans>
    </p>
    <SessionUpdatingFormSubmitter
      mutation={LogoutMutation}
      initialState={{}}
      onSuccessRedirect={EvictionFreeRoutes.locale.home}
    >
      {(ctx) => (
        <div className="buttons jf-two-buttons jf-log-out-button-container">
          <NextButton
            isLoading={ctx.isLoading}
            label={li18n._(t`Yes, Sign Out`)}
          />
        </div>
      )}
    </SessionUpdatingFormSubmitter>
  </Page>
);
