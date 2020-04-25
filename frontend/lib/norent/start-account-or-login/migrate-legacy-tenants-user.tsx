import React from "react";
import { StartAccountOrLoginProps } from "./steps";
import Page from "../../ui/page";
import { OutboundLink } from "../../analytics/google-analytics";
import { ProgressButtons } from "../../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { PrepareLegacyTenantsAccountForMigrationMutation } from "../../queries/PrepareLegacyTenantsAccountForMigrationMutation";

export const MigrateLegacyTenantsUser: React.FC<StartAccountOrLoginProps> = ({
  routes,
  ...props
}) => {
  return (
    <Page title="Hello, long-time JustFix.nyc user!" withHeading="big">
      <div className="content">
        <p>
          In order to proceed, you'll need to migrate your account to our new
          system.
        </p>
        <p>
          Once you migrate your account, you will only be able to access the
          legacy JustFix.nyc services&mdash;tools like "Build your case", the
          advocate dashboard, and so on&mdash;if you log into them at{" "}
          <OutboundLink href="https://beta.justfix.nyc">
            beta.justfix.nyc
          </OutboundLink>{" "}
          using your password for that system.
        </p>
        <p>
          Your new account will have a different password and will be used to
          access JustFix.nyc's new services.
        </p>
        <SessionUpdatingFormSubmitter
          mutation={PrepareLegacyTenantsAccountForMigrationMutation}
          initialState={{}}
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => (
            <ProgressButtons
              nextLabel="Migrate my account"
              isLoading={ctx.isLoading}
              back={props.prevStep}
            ></ProgressButtons>
          )}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
};
