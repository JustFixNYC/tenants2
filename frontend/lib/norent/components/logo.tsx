import React from "react";
import { BulmaImageClass } from "../../ui/bulma";
import { StaticImage } from "../../ui/static-image";
import { getImageSrc } from "../homepage";

/* I know there is a way to dynamically set the color of an svg,
but I suspected it would require some refactoring of the svg files themselves... 
Also since we only need two colors of the logo currently, 
I didn't spend too much time investigating. */
type NorentLogoColor = "white" | null;

export const NorentLogo = (props: {
  size: BulmaImageClass;
  color?: NorentLogoColor;
}) => (
  <div className="jf-norent-logo">
    <StaticImage
      ratio={props.size}
      src={getImageSrc(props.color === "white" ? "logo-white" : "logo")}
      alt="No Rent"
    />
  </div>
);
