import React from 'react';

import { DetailedHTMLProps, AnchorHTMLAttributes, MouseEvent } from "react";
import { Omit, callOnceWithinMs, getFunctionProperty } from "./util";

/**
 * The analytics.js API is provided by Google Analytics:
 * 
 *   https://developers.google.com/analytics/devguides/collection/analyticsjs/
 * 
 * Here we only define the parts of it that we use.
 */
export interface GoogleAnalyticsAPI {
  // https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
  (cmd: 'set', fieldName: 'page', fieldValue: string): void;
  (cmd: 'send', hitType: 'pageview'): void;
  // https://support.google.com/analytics/answer/1136920?hl=en
  (cmd: 'send', hitType: 'event', eventCategory: 'outbound', eventAction: 'click', url: string, fields: {
    transport: 'beacon',
    hitCallback: () => void
  }): void;
};

declare global {
  interface Window {
    /**
     * A reference to the ga() global function, provided by analytics.js.
     *
     * However, it won't exist if the app hasn't been configured to support GA.
     */
    ga: GoogleAnalyticsAPI|undefined;
  }
}

/** 
 * A safe reference to a GA API we can use. If GA isn't configured,
 * this is largely a no-op.
 */
export const ga: GoogleAnalyticsAPI = function ga() {
  if (typeof(window) !== 'undefined' && typeof(window.ga) === 'function') {
    window.ga.apply(window, arguments);
  } else {
    // If anything passed a hit callback, just call it immediately.
    Array.from(arguments).forEach((arg: unknown) => {
      const hitCallback = getFunctionProperty(arg, 'hitCallback');
      if (hitCallback) {
        setTimeout(hitCallback, 0);
      }
    });
  }
};

/**
 * Track a virtual page view in our single-page application.
 *
 * @param pathname The new page the user has arrived at.
 */
export function trackPageView(pathname: string) {
  ga('set', 'page', pathname);
  ga('send', 'pageview');
}

/** An event handler executed when a user clicks on an outbound link. */
export function handleOutboundLinkClick(e: MouseEvent<HTMLAnchorElement>) {
  // If any modifier key is pressed, odds are that the user is trying to
  // invoke some browser-specific behavior to e.g. open the link in a
  // new window or tab. We don't want to break that.
  const isModifierPressed = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;

  if (!isModifierPressed) {
    const { href } = e.currentTarget;

    ga('send', 'event', 'outbound', 'click', href, {
      transport: 'beacon',
      // It's actually possible that GA never loaded, and window.ga is just
      // the stub in the GA snippet; there are other potential edge cases,
      // so let's ensure that we navigate regardless within a reasonable
      // time window to be safe.
      hitCallback: callOnceWithinMs(() => {
        document.location.href = href;
      }, 1000)
    });
    e.preventDefault();
  }
}

type OutboundLinkProps = Omit<DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & {
  /** The "href" prop is required on outbound links, not optional. */
  href: string;
}, 'onClick'>;

/**
 * A react component that encapsulates a link to an external website,
 * which we want to track with analytics.
 */
export function OutboundLink(props: OutboundLinkProps): JSX.Element {
  return <a {...props} onClick={handleOutboundLinkClick}>{props.children}</a>;
}
