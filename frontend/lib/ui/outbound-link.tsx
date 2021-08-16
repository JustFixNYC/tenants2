import React from "react";
import { DetailedHTMLProps, AnchorHTMLAttributes, MouseEvent } from "react";
import hardRedirect from "../browser-redirect";
import { callOnceWithinMs } from "../util/util";
import { ga } from "../analytics/google-analytics";
import { logAmplitudeOutboundLinkClick } from "../analytics/amplitude";

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
    // Note that we're not currently logging Amplitude events in this branch,
    // but that should be OK because we almost always follow the other branch
    // in practice (virtually all our external links open in a new window).
    e.preventDefault();
  } else {
    ga("send", "event", "outbound", "click", href);
    logAmplitudeOutboundLinkClick(href);
  }
}

export type OutboundLinkProps = DetailedHTMLProps<
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
