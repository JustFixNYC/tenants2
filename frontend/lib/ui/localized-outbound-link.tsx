import React from "react";
import i18n, { SupportedLocaleMap } from "../i18n";
import { OutboundLink } from "../analytics/google-analytics";
import { Trans } from "@lingui/react";

/**
 * A mapping from supported locales to URLs. At minimum,
 * an entry must be present for English, but all other
 * locales are optional.
 */
type PartiallyLocalizedHrefs = {
  en: string;
} & Partial<SupportedLocaleMap<string>>;
export type LocalizedOutboundLinkProps = {
  /**
   * The human-readable text of the link. It should already be
   * localized in the end-user's locale.
   */
  children: React.ReactNode;

  /** The URLs of the link for each supported locale. */
  hrefs: PartiallyLocalizedHrefs;
};

/**
 * This component can be used to render an outbound link that
 * may be different for each supported locale.
 *
 * If the link isn't available in the user's preferred locale,
 * the English version will be rendered, and the link text
 * will contain text indicating that the resource is in
 * English.
 */
export const LocalizedOutboundLink: React.FC<LocalizedOutboundLinkProps> = (
  props
) => {
  const href = props.hrefs[i18n.locale];

  if (!href) {
    return (
      <EnglishOutboundLink href={props.hrefs.en} children={props.children} />
    );
  }

  return (
    <OutboundLink target="_blank" rel="noopener noreferrer" href={href}>
      {props.children}
    </OutboundLink>
  );
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

export type EnglishOutboundLinkProps = {
  /** The human-readable text of the link. */
  children: React.ReactNode;

  /** The URL of the link for English. */
  href: string;
};

/**
 * This component can be used to render an outbound link that
 * is only available in English. The link text will indicate
 * that the resource is in English to non-English readers,
 * while English readers will just see the normal link text.
 *
 * The component's children should already be in the end-user's
 * locale.
 */
export const EnglishOutboundLink: React.FC<EnglishOutboundLinkProps> = (
  props
) => {
  const children =
    i18n.locale === "en" ? (
      props.children
    ) : (
      <Trans description="This is used to describe a link to another website that is only available in English.">
        {props.children} (in English)
      </Trans>
    );

  return (
    <OutboundLink target="_blank" rel="noopener noreferrer" href={props.href}>
      {children}
    </OutboundLink>
  );
};
