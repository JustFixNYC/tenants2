import React from "react";
import { BulmaImageClass } from "../../ui/bulma";
import { StaticImage } from "../../ui/static-image";
import { getImageSrc } from "../homepage";
import { OutboundLink } from "../../analytics/google-analytics";

/* I know there is a way to dynamically set the color of an svg,
but I suspected it would require some refactoring of the svg files themselves... 
Also since we only need three colors of the logo currently, 
I didn't spend too much time investigating. */
type NorentLogoColor = "white" | "dark" | "default" | null;

export const NorentLogo = (props: {
  size: BulmaImageClass;
  color?: NorentLogoColor;
  altText?: string;
}) => (
  <div className="jf-norent-logo">
    <StaticImage
      ratio={props.size}
      src={getImageSrc(
        props.color === "white"
          ? "logo-white"
          : props.color === "dark"
          ? "logo-dark"
          : "logo"
      )}
      alt={props.altText || "No Rent"}
    />
  </div>
);

export const JustfixLogo = (props: { isHyperlinked?: boolean }) => {
  const logoImage = (
    <StaticImage
      ratio="is-3by1"
      src={getImageSrc("justfix")}
      alt="JustFix.nyc"
    />
  );

  return (
    <div className="jf-justfix-logo">
      {props.isHyperlinked ? (
        <OutboundLink
          href="https://www.justfix.nyc/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {logoImage}
        </OutboundLink>
      ) : (
        logoImage
      )}
    </div>
  );
};
