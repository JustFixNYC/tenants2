import { AmplitudeClient, LogReturn } from "amplitude-js";
import { SiteChoice } from "../../../common-data/site-choices";
import { USStateChoice } from "../../../common-data/us-state-choices";
import { SignupIntent } from "../../../common-data/signup-intent-choices";
import { LeaseChoice } from "../../../common-data/lease-choices";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { isDeepEqual, assertNotNull } from "../util/util";
import { ServerFormFieldError } from "../forms/form-errors";

export type JustfixAmplitudeUserProperties = {
  city: string;
  state: USStateChoice;
  signupIntent: SignupIntent;
  leaseType: LeaseChoice;
  prefersLegacyApp: boolean | null;
  isEmailVerified: boolean;
  hasSentNorentLetter: boolean;
  hasFiledEHPA: boolean;
  issueCount: number;
};

export type JustfixAmplitudeClient = Omit<
  AmplitudeClient,
  "logEvent" | "setUserProperties"
> & {
  logEvent(
    event: "Page viewed",
    data: {
      pathname: string;
      siteType: SiteChoice;
    }
  ): LogReturn;

  logEvent(
    event: "Exception occurred",
    data: {
      errorString: string;
    }
  ): LogReturn;

  logEvent(
    event: "Form submitted",
    data: {
      pathname: string;
      formKind: string;
      formId?: string;
      redirect?: string;
      errorMessages?: string[];
      errorCodes?: string[];
    }
  ): LogReturn;

  setUserProperties(properties: Partial<JustfixAmplitudeUserProperties>): void;
};

export interface JustfixAmplitudeAPI {
  getInstance(): JustfixAmplitudeClient;
}

declare global {
  interface Window {
    amplitude: JustfixAmplitudeAPI | undefined;
  }
}

export function getAmplitude(): JustfixAmplitudeClient | undefined {
  if (typeof window === "undefined") return undefined;
  return window.amplitude?.getInstance();
}

function getUserPropertiesFromSession(
  s: AllSessionInfo
): Partial<JustfixAmplitudeUserProperties> {
  return {
    city:
      s.onboardingInfo?.city ??
      s.norentScaffolding?.city ??
      s.onboardingStep1?.borough,
    state:
      (s.onboardingInfo?.state as USStateChoice) ??
      s.norentScaffolding?.state ??
      (s.onboardingStep1?.borough ? "NY" : undefined),
    signupIntent: s.onboardingInfo?.signupIntent,
    leaseType:
      (s.onboardingInfo?.leaseType as LeaseChoice) ??
      s.onboardingStep3?.leaseType ??
      undefined,
    prefersLegacyApp: s.prefersLegacyApp,
    isEmailVerified: s.isEmailVerified ?? undefined,
    hasSentNorentLetter: !!s.norentLatestLetter,
    hasFiledEHPA: s.emergencyHpActionSigningStatus === "SIGNED",
    issueCount: s.issues.length + (s.customIssuesV2?.length ?? 0),
  };
}

export function updateAmplitudeUserPropertiesOnSessionChange(
  prevSession: AllSessionInfo,
  session: AllSessionInfo
): boolean {
  const prevUserProperties = getUserPropertiesFromSession(prevSession);
  const userProperties = getUserPropertiesFromSession(session);

  if (isDeepEqual(prevUserProperties, userProperties)) {
    return false;
  }

  getAmplitude()?.setUserProperties(userProperties);
  return true;
}

export function trackLoginInAmplitude(s: AllSessionInfo) {
  const userId = assertNotNull(s.userId).toString();
  getAmplitude()?.setUserId(userId);
  getAmplitude()?.setUserProperties(getUserPropertiesFromSession(s));
}

export function trackLogoutInAmplitude(s: AllSessionInfo) {
  // Note that we could also call `regenerateDeviceId()` after this
  // to completely dissociate the user who is logging out from
  // the newly anonymous user, but that would prevent us from
  // being able to see that two users are actually using the same
  // device, so we're not going to do that.
  getAmplitude()?.setUserId(null);
  getAmplitude()?.setUserProperties(getUserPropertiesFromSession(s));
}

export function logAmplitudeFormSubmission(options: {
  pathname: string;
  formKind: string;
  formId?: string;
  redirect?: string | null;
  errors?: ServerFormFieldError[];
}) {
  let errorMessages: string[] | undefined = undefined;
  let errorCodes: string[] | undefined = undefined;
  if (options.errors) {
    errorMessages = [];
    errorCodes = [];
    for (let fieldErrors of options.errors) {
      const { field } = fieldErrors;
      for (let error of fieldErrors.extendedMessages) {
        errorMessages.push(`${field}: ${error.message}`);
        if (error.code) {
          errorCodes.push(`${field}: ${error.code}`);
        }
      }
    }
  }

  getAmplitude()?.logEvent("Form submitted", {
    pathname: options.pathname,
    formKind: options.formKind,
    formId: options.formId,
    redirect: options.redirect ?? undefined,
    errorMessages,
    errorCodes,
  });
}
