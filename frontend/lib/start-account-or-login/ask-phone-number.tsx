import React from "react";
import { QueryOrVerifyPhoneNumberMutation } from "../queries/QueryOrVerifyPhoneNumberMutation";
import { PhoneNumberFormField } from "../forms/phone-number-form-field";
import { ProgressButtons } from "../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { assertNotNull } from "../util/util";
import Page from "../ui/page";
import { StartAccountOrLoginProps } from "./routes";
import { PhoneNumberAccountStatus } from "../queries/globalTypes";
import { Accordion } from "../ui/accordion";
import { ModalLink } from "../ui/modal";
import { PrivacyInfoModal } from "../ui/privacy-info-modal";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";

export function getRouteForAccountStatus(
  { routes, nextStep }: StartAccountOrLoginProps,
  status: PhoneNumberAccountStatus
): string {
  switch (status) {
    case PhoneNumberAccountStatus.NO_ACCOUNT:
      return nextStep;
    case PhoneNumberAccountStatus.ACCOUNT_WITH_PASSWORD:
      return routes.verifyPassword;
    case PhoneNumberAccountStatus.ACCOUNT_WITHOUT_PASSWORD:
      return routes.verifyPhoneNumber;
  }
}

export const AskPhoneNumber: React.FC<StartAccountOrLoginProps> = (props) => {
  return (
    <Page title={li18n._(t`Your phone number`)} withHeading="big">
      <div className="content">
        <p className="jf-space-below-2rem">
          <Trans>
            Whether it's your first time here, or you're a returning user, let's
            start with your number.
          </Trans>
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
              label={li18n._(t`Phone number`)}
            />
            <div className="content">
              <Accordion
                question={li18n._(t`Why do you need this information?`)}
              >
                <Trans id="norent.whyIsPhoneNumberNeeded">
                  We’ll use this information to either:
                  <ol className="is-marginless">
                    <li>Log you into your existing account</li>
                    <li>Match with a pre-existing account </li>
                    <li>Sign you up for a new account.</li>
                  </ol>
                </Trans>
              </Accordion>
              <p className="is-size-6">
                <Trans>
                  Your privacy is very important to us! Everything on
                  JustFix.nyc is secure.
                </Trans>{" "}
                <ModalLink
                  to={props.routes.phoneNumberTermsModal}
                  component={() => <PrivacyInfoModal />}
                  className="has-text-weight-normal"
                >
                  <Trans>
                    Click here to learn more about our privacy policy.
                  </Trans>
                </ModalLink>
              </p>
            </div>
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};
