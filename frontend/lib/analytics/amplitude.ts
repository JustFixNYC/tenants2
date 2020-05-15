import { AmplitudeClient } from "amplitude-js";
import { SiteChoice } from "../../../common-data/site-choices";
import { USStateChoice } from "../../../common-data/us-state-choices";
import { SignupIntent } from "../../../common-data/signup-intent-choices";
import { LeaseChoice } from "../../../common-data/lease-choices";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { isDeepEqual } from "../util/util";
import { ServerFormFieldError } from "../forms/form-errors";
import { getGlobalSiteRoutes } from "../routes";
import { getGlobalAppServerInfo, AppServerInfo } from "../app-context";
import { LocaleChoice } from "../../../common-data/locale-choices";
import i18n from "../i18n";

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

type PageInfo = {
  pathname: string;
  locale: LocaleChoice;
  siteType: SiteChoice;
};

type FormSubmissionEventData = PageInfo & {
  formKind: string;
  formId?: string;
  redirect?: string;
  errorMessages?: string[];
  errorCodes?: string[];
};

export type JustfixAmplitudeClient = Omit<
  AmplitudeClient,
  "setUserProperties"
> & {
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

function getAmplitude(): JustfixAmplitudeClient | undefined {
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
  // This will make it easier to distinguish our user IDs from
  // Amplitude ones, which are just really large numbers.
  const userId = `justfix:${s.userId}`;
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

const FRIENDLY_SITE_NAMES: { [k in SiteChoice]: string } = {
  JUSTFIX: "justfix.nyc",
  NORENT: "norent.org",
};

function getPageInfo(pathname: string): PageInfo {
  const serverInfo = getGlobalAppServerInfo();
  return {
    pathname: unlocalizePathname(pathname, serverInfo),
    locale: i18n.locale,
    siteType: serverInfo.siteType,
  };
}

function unlocalizePathname(
  pathname: string,
  serverInfo: AppServerInfo
): string {
  const { prefix } = getGlobalSiteRoutes(serverInfo).locale;
  return pathname.startsWith(prefix + "/")
    ? pathname.substring(prefix.length)
    : pathname;
}

function getFriendlyAmplitudePagePath(
  pathname: string,
  serverInfo = getGlobalAppServerInfo()
): string {
  const siteName = FRIENDLY_SITE_NAMES[serverInfo.siteType];
  pathname = unlocalizePathname(pathname, serverInfo);
  return `${siteName}${pathname}`;
}

export function logAmplitudePageView(pathname: string) {
  const data: PageInfo = getPageInfo(pathname);
  const eventName = `Viewed page ${getFriendlyAmplitudePagePath(pathname)}`;
  getAmplitude()?.logEvent(eventName, data);
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

  const formName = options.formId ? `Form ${options.formId}` : "Form";
  const friendlyPath = getFriendlyAmplitudePagePath(options.pathname);
  const eventName = `Submitted ${formName} on ${friendlyPath}`;
  const data: FormSubmissionEventData = {
    ...getPageInfo(options.pathname),
    formKind: options.formKind,
    formId: options.formId,
    redirect: options.redirect ?? undefined,
    errorMessages,
    errorCodes,
  };
  getAmplitude()?.logEvent(eventName, data);
}
