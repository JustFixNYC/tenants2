import { OnboardingInfoSignupIntent } from "./queries/globalTypes";

export interface GTMDataLayer {
  push(obj: GTMDataLayerObject): void;
}

declare global {
  interface Window {
    /**
     * A reference to the dataLayer global object, provided by the GTM snippet.
     *
     * However, it won't exist if the app hasn't been configured to support GTM.
     */
    dataLayer: GTMDataLayer|undefined;
  }
}

/** Data layer event to send when a user signs up. */
type GTMSignupEvent = {
  event: 'jf.signup',
  'jf.signupIntent': OnboardingInfoSignupIntent|null
};

/**
 * "get started" buttons are associated with actions that users sign up
 * for, but also for some other actions that don't require login.
 */
export type GetStartedIntent = OnboardingInfoSignupIntent | "RH";

/**
 * We generally have two pages with "get started" buttons: splash pages,
 * which typically require no login, and welcome pages, which are
 * shown to users after they have completed onboarding.
 */
export type GetStartedPageType = "splash" | "welcome";

/**
 * Data layer event to send when a user starts an action,
 * usually by clicking a big button with text similar to "get started".
 */
type GTMGetStartedEvent = {
  event: 'jf.getStarted',
  'jf.getStartedIntent': GetStartedIntent,
  'jf.getStartedPageType': GetStartedPageType,
};

/**
 * Data layer event to send when the user successfully submits a form.
 */
type GTMFormSuccessEvent = {
  event: 'jf.formSuccess',
  'jf.formKind': string,
  'jf.formId'?: string,
  'jf.redirect'?: string,
};

export type GTMDataLayerObject = GTMSignupEvent | GTMGetStartedEvent | GTMFormSuccessEvent;

export function getDataLayer(): GTMDataLayer {
  return window.dataLayer || [];
}
