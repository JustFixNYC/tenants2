import React from "react";
import { StaticImage } from "../../ui/static-image";
import { getImageSrc } from "../homepage";
import { OutboundLink } from "../../analytics/google-analytics";
import { getGlobalAppServerInfo } from "../../app-context";

/**
 * Links to JustFix.nyc's main social media pages.
 */
const socialMediaPageLinks = [
  { name: "twitter", url: "https://twitter.com/JustFixNYC" },
  { name: "facebook", url: "https://www.facebook.com/JustFixNYC/" },
  { name: "instagram", url: "https://www.instagram.com/justfixnyc/" },
];

const prefilledTwitterCopy =
  "No idea how you'll pay rent this month? Tell your landlord with norent.org from @JustFixNYC. " +
  "This free tool sends a certified letter informing them of your protections. " +
  "Join the #cancelrent movement at norent.org.";
const prefilledEmailSubject =
  "Just used JustFix.nyc's new free tool to tell my landlord I can't pay rent";
const prefilledEmailBody =
  "I used www.norent.org to tell my landlord that I'm unable to pay May's rent. " +
  "This free tool helps you build and send a letter to your landlord, cites legal protections in your state, " +
  "and connects you to other people in your community working to #cancelrent";

/**
 * Links for users to share out the product on social media
 * with a pre-filled message (if applicable)
 */
const socialMediaShareOutLinks = [
  {
    name: "twitter",
    url:
      `https://twitter.com/intent/tweet` +
      `?text=${encodeURIComponent(prefilledTwitterCopy)}`,
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
      `?subject=${encodeURIComponent(prefilledEmailSubject)}` +
      `&body=${encodeURIComponent(prefilledEmailBody)}`,
  },
];

type SocialIconColor = "white" | "default" | null;

export const SocialIcons = (props: {
  color?: SocialIconColor;
  linksAreForSharing?: boolean;
}) => {
  const links = props.linksAreForSharing
    ? socialMediaShareOutLinks
    : socialMediaPageLinks;
  return (
    <div className="buttons jf-social-icons">
      {links.map((link, i) => (
        <OutboundLink
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          key={i}
        >
          <StaticImage
            ratio="is-48x48"
            src={getImageSrc(
              props.color === "white" ? link.name + "-white" : link.name
            )}
            alt={link.name}
          />
        </OutboundLink>
      ))}
    </div>
  );
};
