import React from "react";
import { StaticImage } from "../../ui/static-image";
import { getNorentImageSrc } from "../homepage";
import { OutboundLink } from "../../ui/outbound-link";
import { getGlobalAppServerInfo } from "../../app-context";
import { li18n } from "../../i18n-lingui";
import { MessageDescriptor } from "@lingui/core";
import classnames from "classnames";

/**
 * Links to JustFix.nyc's main social media pages.
 */
const socialMediaPageLinks = [
  { name: "twitter", url: "https://twitter.com/JustFixNYC" },
  { name: "facebook", url: "https://www.facebook.com/JustFixNYC/" },
  { name: "instagram", url: "https://www.instagram.com/justfixnyc/" },
];

export type SocialShareContent = {
  tweet: MessageDescriptor;
  emailSubject: MessageDescriptor;
  emailBody: MessageDescriptor;
};

/**
 * Links for users to share out the product on social media
 * with a pre-filled message (if applicable)
 */
const socialMediaShareOutLinks = (content: SocialShareContent) => [
  {
    name: "twitter",
    url:
      `https://twitter.com/intent/tweet` +
      `?text=${encodeURIComponent(li18n._(content.tweet))}`,
  },
  {
    name: "facebook",
    url: getGlobalAppServerInfo().facebookAppId
      ? `https://www.facebook.com/dialog/share` +
        `?app_id=${encodeURIComponent(
          getGlobalAppServerInfo().facebookAppId
        )}` +
        `&display=popup&href=${getGlobalAppServerInfo().originURL}` +
        `&redirect_uri=https%3A%2F%2Fwww.facebook.com%2F`
      : `https://www.facebook.com/sharer/sharer.php` +
        `?u=${encodeURI(getGlobalAppServerInfo().originURL)}`,
  },
  {
    name: "email",
    url:
      `mailto:` +
      `?subject=${encodeURIComponent(li18n._(content.emailSubject))}` +
      `&body=${encodeURIComponent(li18n._(content.emailBody))}`,
  },
];

type SocialIconColor = "white" | "mulberry" | "default" | null;

export const SocialIcons = (props: {
  color?: SocialIconColor;
  socialShareContent?: SocialShareContent;
  customStyleClasses?: string;
}) => {
  const links = props.socialShareContent
    ? socialMediaShareOutLinks(props.socialShareContent)
    : socialMediaPageLinks;
  return (
    <div
      className={classnames(
        "buttons",
        "jf-social-icons",
        props.customStyleClasses
      )}
    >
      {links.map((link, i) => (
        <OutboundLink
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          key={i}
        >
          <StaticImage
            ratio="is-48x48"
            src={getNorentImageSrc(
              props.color && props.color !== "default"
                ? `${link.name}-${props.color}`
                : link.name
            )}
            alt={link.name}
          />
        </OutboundLink>
      ))}
    </div>
  );
};
