import { AmplitudeClient } from "amplitude-js";
import { SiteChoice } from "../../../common-data/site-choices";
import { USStateChoice } from "../../../common-data/us-state-choices";
import { SignupIntent } from "../../../common-data/signup-intent-choices";
import { LeaseChoice } from "../../../common-data/lease-choices";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { isDeepEqual } from "../util/util";
import { ServerFormFieldError } from "../forms/form-errors";
import { getGlobalSiteRoutes } from "../global-site-routes";
import { getGlobalAppServerInfo, AppServerInfo } from "../app-context";
import { LocaleChoice } from "../../../common-data/locale-choices";
import i18n from "../i18n";
import JustfixRoutes from "../justfix-route-info";
import { NorentRoutes } from "../norent/route-info";
import { EvictionFreeRoutes } from "../evictionfree/route-info";
import { USER_ID_PREFIX } from "../../../common-data/amplitude.json";

/**
 * We need to be very careful here that we don't conflict with any of
 * the user properties sent by the back-end code!  See the
 * `amplitude` Django app for more details.
 */
export type JustfixAmplitudeUserProperties = {
  city: string;
  state: USStateChoice;
  signupIntent: SignupIntent;
  leaseType: LeaseChoice;
  isEmailVerified: boolean;
  hasSentNorentLetter: boolean;
  hasFiledEHPA: boolean;
  issueCount: number;

  /**
   * This field is no longer relevant since we decomissioned the
   * legacy app, but we're keeping it around in the type definition
   * for documentation purposes.  It was used to track whether the
   * user wanted to be redirected to the legacy tenants app instead
   * of the new one.
   */
  prefersLegacyApp: boolean | null;
};

type PageInfo = {
  pathname: string;
  locale: LocaleChoice;
  siteType: SiteChoice;
};

type OutboundLinkEventData = PageInfo & {
  href: string;
};

type FormSubmissionEventData = PageInfo & {
  formKind: string;
  formId?: string;
  redirect?: string;
  errorMessages?: string[];
  errorCodes?: string[];
  search?: string;
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
    prefersLegacyApp: null,
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
  const userId = `${USER_ID_PREFIX}${s.userId}`;
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

export function logAmplitudePageView(pathname: string) {
  const data: PageInfo = getPageInfo(pathname);
  const eventName = `Viewed ${getAmplitudePageType(pathname)}`;
  getAmplitude()?.logEvent(eventName, data);
}

export function logAmplitudeOutboundLinkClick(href: string) {
  const data: OutboundLinkEventData = {
    ...getPageInfo(window.location.pathname),
    href,
  };
  getAmplitude()?.logEvent("Clicked outbound link", data);
}

export function logAmplitudeFormSubmission(options: {
  pathname: string;
  formKind: string;
  search?: string;
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

  const data: FormSubmissionEventData = {
    ...getPageInfo(options.pathname),
    formKind: options.formKind,
    formId: options.formId,
    search: options.search,
    redirect: options.redirect ?? undefined,
    errorMessages,
    errorCodes,
  };
  const eventName =
    errorMessages && errorMessages.length
      ? "Submitted form with errors"
      : "Submitted form successfully";
  getAmplitude()?.logEvent(eventName, data);
}

type StringMapping = {
  [k: string]: string;
};

function findBestPage(pathname: string, mapping: StringMapping): string {
  for (let [prefix, name] of Object.entries(mapping)) {
    if (pathname.startsWith(prefix)) {
      return `${name} page`;
    }
  }
  return "page";
}

function getJustfixPageType(pathname: string): string {
  const r = JustfixRoutes.locale;
  if (pathname === r.home) return "DDO";
  return findBestPage(pathname, {
    [r.ehp.prefix]: "Emergency HP Action",
    [r.hp.prefix]: "HP Action",
    [r.loc.prefix]: "Letter of Complaint",
    [r.locOnboarding.prefix]: "Letter of Complaint",
    [r.rh.prefix]: "Rent History",
  });
}

function getNorentPageType(pathname: string): string {
  const r = NorentRoutes.locale;
  return findBestPage(pathname, {
    [r.letter.prefix]: "letter builder",
  });
}

function getEvictionFreePageType(pathname: string): string {
  const r = EvictionFreeRoutes.locale;
  return findBestPage(pathname, {
    [r.declaration.prefix]: "declaration builder",
  });
}

export function getAmplitudePageType(pathname: string): string {
  const { siteType } = getGlobalAppServerInfo();

  switch (siteType) {
    case "JUSTFIX":
      return "JustFix " + getJustfixPageType(pathname);
    case "NORENT":
      return "NoRent " + getNorentPageType(pathname);
    case "EVICTIONFREE":
      return "EvictionFree " + getEvictionFreePageType(pathname);
  }
}
