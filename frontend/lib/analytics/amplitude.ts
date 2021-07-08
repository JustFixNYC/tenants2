import { AmplitudeClient } from "amplitude-js";
import { SiteChoice } from "../../../common-data/site-choices";
import { USStateChoice } from "../../../common-data/us-state-choices";
import { SignupIntent } from "../../../common-data/signup-intent-choices";
import { LeaseChoice } from "../../../common-data/lease-choices";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { isDeepEqual } from "../util/util";
import { ServerFormFieldError } from "../forms/form-errors";
import { getGlobalSiteRoutes } from "../global-site-routes";
import { getGlobalAppServerInfo } from "../app-context";
import { LocaleChoice } from "../../../common-data/locale-choices";
import i18n from "../i18n";
import JustfixRoutes from "../justfix-route-info";
import { NorentRoutes } from "../norent/route-info";
import { EvictionFreeRoutes } from "../evictionfree/route-info";
import { USER_ID_PREFIX } from "../../../common-data/amplitude";

/**
 * These are Amplitude user properties updated by the front-end.
 *
 * From the Amplitude documentation:
 *
 *   > User properties are the attributes of individual users. Common
 *   > user properties include device type, location, User ID, and
 *   > whether the user is a paying customer or not.
 *
 * We need to be very careful here that we don't conflict with any of
 * the user properties sent by the back-end code!  For more details, see
 * the `amplitude` Django app--especially its `export_to_amplitude.py`
 * file.
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

/**
 * This structure has Amplitude event properties shared by many
 * of our events.
 */
type PageInfo = {
  /**
   * The pathname of the URL the user was on when the event took place,
   * *without* any leading locale, e.g. `/account`.
   *
   * Because the locale isn't included, we can easily aggregate
   * statistics without having to account for every possible locale
   * we support.
   */
  pathname: string;

  /**
   * The locale the user was using when the event took place, e.g. `en`.
   */
  locale: LocaleChoice;

  /**
   * The site the user was on when the event took place, e.g. `NORENT`.
   */
  siteType: SiteChoice;
};

/**
 * Amplitude event properties for outbound link clicks.
 */
type OutboundLinkEventData = PageInfo & {
  /**
   * The "href" attribute of the outbound link the user clicked on.
   */
  href: string;
};

/**
 * Amplitude event properties for form submissions.
 */
type FormSubmissionEventData = PageInfo & {
  /**
   * This is usually the name of the GraphQL mutation that processed
   * the form submission.
   */
  formKind: string;

  /**
   * The unique id of the form on the page (this is often set if
   * there are multiple forms on the page).
   */
  formId?: string;

  /**
   * If the form submission redirected the user somewhere, this
   * is the value of the redirect.
   */
  redirect?: string;

  /**
   * If the form submission resulted in any validation errors,
   * this is a list of all the error messages shown to the user,
   * preceded by their field name, e.g. `"state: This field is required"`
   * or `"__all__: Please choose at least one option"`.
   *
   * Note that the error messages will be localized to whatever locale
   * the user has activated, so `"phoneNumber: Este campo es obligatorio."`
   * is a valid potential error message.
   */
  errorMessages?: string[];

  /**
   * If the form submission resulted in any validation errors,
   * this is a list of all the error codes, preceded by their field
   * name, e.g. `"password: password_too_short"`.
   */
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

/**
 * Returns the Amplitude client, or `undefined` if
 * Amplitude integration is disabled.
 */
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

/**
 * Returns page information about the given URL pathname, to
 * be included as event properties for events that take place
 * on that page.
 *
 * @see PageInfo
 */
function getPageInfo(pathname: string): PageInfo {
  const serverInfo = getGlobalAppServerInfo();
  return {
    pathname: unlocalizePathname(pathname, serverInfo),
    locale: i18n.locale,
    siteType: serverInfo.siteType,
  };
}

/**
 * Removes the current locale's prefix from the given pathname if
 * it's present.
 *
 * Note that the prefix will only be removed if it's the _current_
 * locale. This is done partly to ensure that we don't accidentally
 * remove prefixes that don't actually represent locales.
 */
export function unlocalizePathname(
  pathname: string,
  serverInfo = getGlobalAppServerInfo()
): string {
  const { prefix } = getGlobalSiteRoutes(serverInfo).locale;
  return pathname.startsWith(prefix + "/")
    ? pathname.substring(prefix.length)
    : pathname;
}

/**
 * Log a page view event in Amplitude.
 *
 * The name of the event is of the form `Viewed [page type]`,
 * where `[page type]` varies based on the page visited.
 */
export function logAmplitudePageView(pathname: string) {
  const data: PageInfo = getPageInfo(pathname);
  const eventName = `Viewed ${getAmplitudePageType(pathname)}`;
  getAmplitude()?.logEvent(eventName, data);
}

/**
 * Log a `Clicked outbound link` event in Amplitude.
 */
export function logAmplitudeOutboundLinkClick(href: string) {
  const data: OutboundLinkEventData = {
    ...getPageInfo(window.location.pathname),
    href,
  };
  getAmplitude()?.logEvent("Clicked outbound link", data);
}

/**
 * Log a form submission event in Amplitude.
 *
 * If the form submission contains errors, the event
 * will be called `Submitted form with errors`. Otherwise
 * it will be called `Submitted form successfully`.
 */
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

/**
 * Given a URL pathname, attempts to figure out the best category
 * for the page, given a mapping from URL pathname prefixes to
 * category names.
 */
function findBestPage(pathname: string, mapping: StringMapping): string {
  for (let [prefix, name] of Object.entries(mapping)) {
    if (pathname.startsWith(prefix)) {
      return `${name} page`;
    }
  }
  return "page";
}

/**
 * Given a URL pathname on the app.justfix.nyc site,
 * returns the type of page it refers to, for the
 * purposes of naming Amplitude events.
 */
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

/**
 * Given a URL pathname on the norent.org site,
 * returns the type of page it refers to, for the
 * purposes of naming Amplitude events.
 */
function getNorentPageType(pathname: string): string {
  const r = NorentRoutes.locale;
  return findBestPage(pathname, {
    [r.letter.prefix]: "letter builder",
  });
}

/**
 * Given a URL pathname on the evictionfreeny.org site,
 * returns the type of page it refers to, for the
 * purposes of naming Amplitude events.
 */
function getEvictionFreePageType(pathname: string): string {
  const r = EvictionFreeRoutes.locale;
  return findBestPage(pathname, {
    [r.declaration.prefix]: "declaration builder",
  });
}

/**
 * Attempts to classify the given URL pathname
 * for the purposes of naming Amplitude events so
 * that they are neither too granular nor too broad.
 */
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
