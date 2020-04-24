import React from "react";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { LogoutMutation } from "../queries/LogoutMutation";
import { NorentRoutes } from "./routes";
import { NextButton } from "../ui/buttons";

export const NorentLogOutPage: React.FC<{}> = () => (
  <Page title="Know your rights">
    <h2 className="title">Are you sure you want to log out?</h2>
    <p>
      Don’t worry, we’ll save your progress so you’ll be able to come back to
      your last step when you log back in.
    </p>
    <SessionUpdatingFormSubmitter
      mutation={LogoutMutation}
      initialState={{}}
      onSuccessRedirect={NorentRoutes.locale.home}
    >
      {(ctx) => (
        <div className="buttons jf-two-buttons">
          <NextButton isLoading={ctx.isLoading} label="Yes, Sign Out" />
        </div>
      )}
    </SessionUpdatingFormSubmitter>
  </Page>
);
