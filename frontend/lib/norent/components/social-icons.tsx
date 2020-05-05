import React from "react";
import { StaticImage } from "../../ui/static-image";
import { getImageSrc } from "../homepage";
import { OutboundLink } from "../../analytics/google-analytics";

const socialMediaLinks = [
  { name: "twitter", url: "https://twitter.com/JustFixNYC" },
  { name: "facebook", url: "https://www.facebook.com/JustFixNYC/" },
  { name: "instagram", url: "https://www.instagram.com/justfixnyc/" },
];

type SocialIconColor = "white" | "default" | null;

export const SocialIcons = (props: { color?: SocialIconColor }) => (
  <div className="buttons jf-social-icons">
    {socialMediaLinks.map((link, i) => (
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
