import React from "react";
import { li18n } from "../../i18n-lingui";
import { t } from "@lingui/macro";

import { OutboundLink } from "../../ui/outbound-link";
import { StaticImage } from "../../ui/static-image";

import { getLaLetterBuilderImageSrc } from "../homepage";

type ClickableLogoProps = {
  imageClassName?: string;
  imageUrl: string;
};

export const ClickableLogo: React.FC<ClickableLogoProps> = (props) => {
  const { imageClassName, imageUrl } = props;
  return (
    <div className="jf-laletterbuilder-combined-logo">
      <OutboundLink
        href="https://www.justfix.nyc/"
        aria-label={li18n._(t`Go to JustFix homepage`)}
      />
      <OutboundLink
        href="https://www.saje.net/"
        aria-label={li18n._(t`Go to SAJE homepage`)}
      />
      <StaticImage
        className={imageClassName}
        ratio="is-3by1"
        src={getLaLetterBuilderImageSrc(imageUrl)}
        alt="JustFix SAJE"
        tabIndex={-1}
      />
    </div>
  );
};
