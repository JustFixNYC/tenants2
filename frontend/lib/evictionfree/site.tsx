import { Trans } from "@lingui/macro";
import loadable from "@loadable/component";
import React from "react";
import type { AppSiteProps } from "../app";
import { createLinguiCatalogLoader } from "../i18n-lingui";

export const EvictionFreeLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(
    () => import("../../../locales/en/evictionfree.chunk") as any
  ),
  es: loadable.lib(
    () => import("../../../locales/es/evictionfree.chunk") as any
  ),
});

const EvictionFreeSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    return (
      <EvictionFreeLinguiI18n>
        <p>
          <Trans>This is a test localization message for EvictionFree.</Trans>
        </p>
      </EvictionFreeLinguiI18n>
    );
  }
);

export default EvictionFreeSite;
