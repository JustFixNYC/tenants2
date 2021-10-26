import React, { useContext } from "react";
import {
  MiddleProgressStep,
  ProgressStepRoute,
} from "../progress/progress-step-route";
import Page, { SiteName } from "../ui/page";
import { PrivacyPolicyLink, TermsOfUseLink } from "../ui/privacy-info-modal";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { AgreeToTermsMutation } from "../queries/AgreeToTermsMutation";
import { AppContext, getGlobalAppServerInfo } from "../app-context";
import { ProgressButtons } from "../ui/buttons";
import { CheckboxFormField, HiddenFormField } from "../forms/form-fields";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { isUserLoggedIn } from "../util/session-predicates";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

export function hasLoggedInUserAgreedToTerms(s: AllSessionInfo): boolean {
  if (!s.onboardingInfo) {
    // This is definitely unusual, but if the user ends up submitting the
    // form we'll log an error on the back-end, so just return false here.
    return false;
  }
  const { siteType } = getGlobalAppServerInfo();
  switch (siteType) {
    case "JUSTFIX":
      return s.onboardingInfo.agreedToJustfixTerms;

    case "NORENT":
      return s.onboardingInfo.agreedToNorentTerms;

    case "EVICTIONFREE":
      return s.onboardingInfo.agreedToEvictionfreeTerms;

    case "LALETTERBUILDER":
      // TODO: Make this real if we need separate terms for LA Letter builder
      return false;
  }
}

export const CrossSiteAgreeToTerms = MiddleProgressStep((props) => {
  const { siteType } = useContext(AppContext).server;

  return (
    <Page
      title={li18n._(t`Please agree to our terms and conditions`)}
      withHeading="big"
    >
      <p>
        <Trans>
          <SiteName short /> makes use of a <PrivacyPolicyLink /> and{" "}
          <TermsOfUseLink />, which you can review.
        </Trans>
      </p>
      <SessionUpdatingFormSubmitter
        mutation={AgreeToTermsMutation}
        initialState={(s) => ({
          agreeToTerms: hasLoggedInUserAgreedToTerms(s),
          site: siteType,
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <HiddenFormField {...ctx.fieldPropsFor("site")} />
            <CheckboxFormField {...ctx.fieldPropsFor("agreeToTerms")}>
              <Trans>
                I agree to the <SiteName short /> terms and conditions.
              </Trans>
            </CheckboxFormField>
            <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});

export function createCrossSiteAgreeToTermsStep(
  path: string
): ProgressStepRoute {
  return {
    path,
    exact: true,
    component: CrossSiteAgreeToTerms,
    shouldBeSkipped: (s) =>
      isUserLoggedIn(s) ? hasLoggedInUserAgreedToTerms(s) : true,
  };
}
