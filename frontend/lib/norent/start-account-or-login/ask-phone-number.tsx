import React from "react";
import { QueryOrVerifyPhoneNumberMutation } from "../../queries/QueryOrVerifyPhoneNumberMutation";
import { PhoneNumberFormField } from "../../forms/phone-number-form-field";
import { ProgressButtons } from "../../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { assertNotNull } from "../../util/util";
import Page from "../../ui/page";
import { StartAccountOrLoginProps } from "./steps";
import { PhoneNumberAccountStatus } from "../../queries/globalTypes";

export function getRouteForAccountStatus(
  { routes, toNextPhase }: StartAccountOrLoginProps,
  status: PhoneNumberAccountStatus
): string {
  switch (status) {
    case PhoneNumberAccountStatus.NO_ACCOUNT:
      return toNextPhase;
    case PhoneNumberAccountStatus.ACCOUNT_WITH_PASSWORD:
      return routes.verifyPassword;
    case PhoneNumberAccountStatus.ACCOUNT_WITHOUT_PASSWORD:
      return routes.verifyPhoneNumber;
  }
}

export const AskPhoneNumber: React.FC<StartAccountOrLoginProps> = (props) => {
  return (
    <Page title="Your phone number" withHeading="big">
      <div className="content">
        <p>
          Whether it's your first time here, or you're a returning user, let's
          start with your number.
        </p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={QueryOrVerifyPhoneNumberMutation}
        initialState={(s) => ({ phoneNumber: s.lastQueriedPhoneNumber || "" })}
        onSuccessRedirect={(output) =>
          getRouteForAccountStatus(props, assertNotNull(output.accountStatus))
        }
      >
        {(ctx) => (
          <>
            <PhoneNumberFormField
              {...ctx.fieldPropsFor("phoneNumber")}
              label="Phone number"
            />
            <ProgressButtons
              isLoading={ctx.isLoading}
              back={props.toPreviousPhase}
            />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};
