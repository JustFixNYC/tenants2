import React from "react";
import { Trans } from "@lingui/macro";

export const LegalDisclaimer: React.FC<{ website: string, className?: string }> = ({ website, className }) => (
  <p className={className || ""}>
    <Trans id="justfix.legalDisclaimer">
      Disclaimer: The information in {website} does not constitute legal advice
      and must not be used as a substitute for the advice of a lawyer qualified
      to give advice on legal issues pertaining to housing. We can help direct
      you to free legal services if necessary.
    </Trans>
  </p>
);
