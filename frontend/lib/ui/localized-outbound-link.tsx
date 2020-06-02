import React from "react";
import { MessageDescriptor } from "@lingui/core";
import i18n, { SupportedLocale } from "../i18n";
import { OutboundLink } from "../analytics/google-analytics";
import { li18n } from "../i18n-lingui";

export type LocalizedOutboundLinkProps = {
  /** The human-readable text of the link. */
  text: MessageDescriptor;

  /** The URLs of the link for each supported locale. */
  urls: { [k in SupportedLocale]: string };
};

/**
 * This component can be used to render an outbound link that
 * may be different for each supported locale.
 */
export const LocalizedOutboundLink: React.FC<LocalizedOutboundLinkProps> = (
  props
) => {
  const href = props.urls[i18n.locale];
  const text = li18n._(props.text);

  return <OutboundLink href={href}>{text}</OutboundLink>;
};

/**
 * An unordered list of localized outbound links.
 *
 * Note that this list is expected to be static, as each item's key will be
 * the item's index in the list.
 */
export const LocalizedOutboundLinkList: React.FC<{
  links: LocalizedOutboundLinkProps[];
}> = (props) => (
  <ul>
    {props.links.map((linkProps, i) => (
      <li key={i}>
        <LocalizedOutboundLink {...linkProps} />
      </li>
    ))}
  </ul>
);
