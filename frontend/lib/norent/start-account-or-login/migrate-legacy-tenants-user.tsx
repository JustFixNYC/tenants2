import React from "react";
import { StartAccountOrLoginProps } from "./steps";
import Page from "../../ui/page";
import { OutboundLink } from "../../analytics/google-analytics";
import { ProgressButtons } from "../../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { PrepareLegacyTenantsAccountForMigrationMutation } from "../../queries/PrepareLegacyTenantsAccountForMigrationMutation";
import { CustomerSupportLink } from "../../ui/customer-support-link";

export const MigrateLegacyTenantsUser: React.FC<StartAccountOrLoginProps> = ({
  routes,
  ...props
}) => {
  return (
    <Page
      title="Hello, long-time JustFix.nyc user! We appreciate you."
      withHeading="big"
    >
      <div className="content">
        <p>
          This is a new system. You will need a new account use it. We're happy
          to set you up with one!
        </p>
        <p>
          Meanwhile, whenever you want to sign into your "Build your case" or
          Advocate Dashboard account, you can sign in with your old account
          information at this URL:
        </p>
        <p className="has-text-centered">
          <OutboundLink href="https://beta.justfix.nyc">
            beta.justfix.nyc
          </OutboundLink>{" "}
        </p>
        <p>
          <strong>Please write this URL down to remember it later.</strong>
        </p>
        <p>
          Your new account will be used to access JustFix.nyc's new services.
        </p>
        <p>
          If you have any questions, please feel free to email us at{" "}
          <CustomerSupportLink />.
        </p>
        <SessionUpdatingFormSubmitter
          mutation={PrepareLegacyTenantsAccountForMigrationMutation}
          initialState={{}}
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => (
            <ProgressButtons
              nextLabel="Create my new account"
              isLoading={ctx.isLoading}
              back={props.prevStep}
            ></ProgressButtons>
          )}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
};
