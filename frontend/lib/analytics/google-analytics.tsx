import React from "react";

import { DetailedHTMLProps, AnchorHTMLAttributes, MouseEvent } from "react";
import { callOnceWithinMs, getFunctionProperty } from "../util/util";
import hardRedirect from "../browser-redirect";

/**
 * The analytics.js API is provided by Google Analytics:
 *
 *   https://developers.google.com/analytics/devguides/collection/analyticsjs/
 *
 * Here we only define the parts of it that we use.
 */
export interface GoogleAnalyticsAPI {
  /**
   * Set the current page. We need to do this multiple times in a single
   * page load because we are a single page application (SPA). For more details, see:
   *
   *   https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
   *
   * @param fieldValue The URL of the page we're now on.
   */
  (cmd: "set", fieldName: "page", fieldValue: string): void;

  /** Send a pageview hit. */
  (cmd: "send", hitType: "pageview"): void;

  /**
   * Track an exception. For more details, see:
   *
   *   https://developers.google.com/analytics/devguides/collection/analyticsjs/exceptions
   *
   * @param exDescription The description of the error.
   * @param exFatal Whether or not the error was fatal.
   */
  (
    cmd: "send",
    hitType: "exception",
    fieldsObject: {
      exDescription: string;
      exFatal: boolean;
    }
  ): void;

  /**
   * A custom event for when a user clicks on an outbound link. For more details, see:
   *
   *   https://support.google.com/analytics/answer/1136920?hl=en
   *
   * @param url The URL that the user clicked on.
   * @param hitCallback A callback that will be called once GA has tracked the hit.
   */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "outbound",
    eventAction: "click",
    url: string,
    fields: {
      transport: "beacon";
      hitCallback: () => void;
    }
  ): void;
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "outbound",
    eventAction: "click",
    url: string
  ): void;

  /**
   * A custom event for when the user clicks on a data-driven onboarding (DDO)
   * action.
   *
   * @param label The label for the DDO action that was clicked.
   */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "ddo-action",
    eventAction: "click",
    label: string
  ): void;

  /**
   * A custom event for when the user tries to unload a page that has
   * unsaved content on it, and we ask them to confirm the action
   * because they may lose data.
   *
   * By "unload" we mean that the user tries to refresh their browser,
   * navigate to a page that isn't in the single-page app, close their
   * browser tab/window, and so on.
   *
   * Unfortunately, we don't have the ability to (easily) report
   * the user's ultimate choice.
   */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "before-unload",
    eventAction: "prevent-default"
  ): void;

  /**
   * A custom event for when the user tries to navigate away from a page that has
   * unsaved content on it, and is prompted to confirm whether they want to leave or not.
   */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "before-navigate",
    eventAction: "confirm",
    eventLabel: "ok" | "cancel"
  ): void;

  /**
   * A custom event for when the user navigates away from a page that has
   * unsaved content on it, but is *not* prompted to confirm whether they
   * want to leave or not.
   *
   * This can be used e.g. to instrument how often users leave a form
   * with unsaved data on it, but without bugging them by bringing up
   * a modal.
   */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "before-navigate",
    eventAction: "no-confirm"
  ): void;

  /** A custom event for when the user shakes their device. */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "motion",
    eventAction: "shake"
  ): void;

  /** A custom event for when the user toggles the hamburger menu. */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "hamburger",
    eventAction: "toggle"
  ): void;

  /**
   * A custom event for when the safe mode (aka compatibility mode) opt-in is shown or hidden.
   */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "safe-mode",
    eventAction: "show" | "hide"
  ): void;

  /**
   * A custom event for tracking form errors.
   *
   * @param formField The form field the error occurred in.
   * @param message The text of the error.
   */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "form-error",
    formField: string,
    message: string
  ): void;

  /**
   * A custom event for tracking forms that have been successfully
   * submitted.
   *
   * @param formId An identifier for the form that was submitted. If the form is the only form on the
   *   page, this can just be "default".
   * @param redirectURL An optional URL identifying the URL that the user was
   *   redirected to after submitting the form.
   */
  (
    cmd: "send",
    hitType: "event",
    eventCategory: "form-success",
    formId: string,
    redirectURL?: string
  ): void;
}

declare global {
  interface Window {
    /**
     * A reference to the ga() global function, provided by analytics.js.
     *
     * However, it won't exist if the app hasn't been configured to support GA.
     */
    ga: GoogleAnalyticsAPI | undefined;
  }
}

/**
 * For the most part, ga() is just a "fire and forget" function,
 * but sometimes we need to pass it callbacks that it calls
 * after it's registered a "hit" with GA. When we don't actually
 * have GA configured, though, we want to simulate this
 * behavior, so the following helper can be used to call
 * any hit callbacks that have been passed to our ga() stub.
 */
function callAnyHitCallbacks(args: unknown[]) {
  for (let arg of args) {
    const hitCallback = getFunctionProperty(arg, "hitCallback");
    if (hitCallback) {
      setTimeout(hitCallback, 0);
    }
  }
}

/**
 * A safe reference to a GA API we can use. If GA isn't configured,
 * this is largely a no-op.
 */
export const ga: GoogleAnalyticsAPI = function ga() {
  if (typeof window !== "undefined" && typeof window.ga === "function") {
    // We're typecasting arguments as "any" here because as of TS 3.2,
    // apply() can't fully model functions that have overloads, which is what
    // ga() is.  However, the fact that we're returning an object that's
    // strongly typed means that type safety is still ensured where it matters
    // most.
    window.ga.apply(window, arguments as any);
  } else {
    callAnyHitCallbacks(Array.from(arguments));
  }
};

/**
 * Track a virtual page view in our single-page application.
 *
 * @param pathname The new page the user has arrived at.
 */
export function trackPageView(pathname: string) {
  ga("set", "page", pathname);
  ga("send", "pageview");
}

/**
 * When we call ga(), it's actually possible that GA never loaded,
 * and window.ga is just the stub in the GA snippet that came with
 * our page. There are other potential edge cases where our
 * hit callback might never be called, so let's ensure that we
 * navigate regardless once the given number of milliseconds
 * have elapsed, just to be safe.
 */
const OUTBOUND_LINK_TIMEOUT_MS = 1000;

/** An event handler executed when a user clicks on an outbound link. */
export function handleOutboundLinkClick(e: MouseEvent<HTMLAnchorElement>) {
  // If any modifier key is pressed, odds are that the user is trying to
  // invoke some browser-specific behavior to e.g. open the link in a
  // new window or tab. We don't want to break that.
  const isModifierPressed = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
  const { href, target } = e.currentTarget;
  const willOpenInNewWindow = target && target !== window.name;
  if (!isModifierPressed && !willOpenInNewWindow) {
    ga("send", "event", "outbound", "click", href, {
      transport: "beacon",
      hitCallback: callOnceWithinMs(
        () => hardRedirect(href),
        OUTBOUND_LINK_TIMEOUT_MS
      ),
    });
    e.preventDefault();
  } else {
    ga("send", "event", "outbound", "click", href);
  }
}

type OutboundLinkProps = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & {
  /** The "href" prop is required on outbound links, not optional. */
  href: string;
};

const defaultOutboundLinkProps = {
  target: "_blank",
  rel: "noopener noreferrer",
};

/**
 * A react component that encapsulates a link to an external website,
 * which we want to track with analytics.
 */
export function OutboundLink(props: OutboundLinkProps): JSX.Element {
  props = { ...defaultOutboundLinkProps, ...props };
  const { onClick, ...otherProps } = props;
  return (
    <a
      {...otherProps}
      onClick={(e) => {
        handleOutboundLinkClick(e);
        if (onClick) onClick(e);
      }}
    >
      {props.children}
    </a>
  );
}
