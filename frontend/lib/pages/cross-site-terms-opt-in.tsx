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

export function hasLoggedInUserAgreedToTerms(s: AllSessionInfo): boolean {
  if (!s.onboardingInfo) {
    console.warn("Logged-in user has no onboarding info!");
    return false;
  }
  const { siteType } = getGlobalAppServerInfo();
  switch (siteType) {
    case "JUSTFIX":
      return s.onboardingInfo.agreedToJustfixTerms;

    case "NORENT":
      return s.onboardingInfo.agreedToNorentTerms;
  }
}

export const CrossSiteAgreeToTerms = MiddleProgressStep((props) => {
  const { siteType } = useContext(AppContext).server;

  return (
    <Page title="Please agree to our privacy policy" withHeading="big">
      <p>
        <SiteName short /> makes use of a <PrivacyPolicyLink /> and{" "}
        <TermsOfUseLink />, which you can review.
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
              I agree to the <SiteName short /> terms and conditions.
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
