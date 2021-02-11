import React from "react";
import { OutboundLink } from "./outbound-link";

/**
 * Generate a PDF download link.
 */
export function PdfLink(props: { href: string; label: string }): JSX.Element {
  return (
    <p className="has-text-centered">
      <OutboundLink
        href={props.href}
        target="_blank"
        className="button is-primary is-medium jf-text-wrap"
      >
        {props.label} (PDF)
      </OutboundLink>
    </p>
  );
}
