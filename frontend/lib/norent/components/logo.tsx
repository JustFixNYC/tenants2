import React from "react";
import { BulmaImageClass } from "../../ui/bulma";
import { StaticImage } from "../../ui/static-image";
import { getImageSrc } from "../homepage";

type NorentLogoColor = "white" | null;

export const NorentLogo = (props: {
  size: BulmaImageClass;
  color?: NorentLogoColor;
}) => (
  <div className="jf-norent-logo">
    <StaticImage
      ratio={props.size}
      src={getImageSrc(props.color === "white" ? "logo-white" : "logo")}
      alt="NoRent logo"
    />
  </div>
);
