import { Trans } from "@lingui/macro";
import loadable from "@loadable/component";
import React from "react";
import { Route } from "react-router-dom";
import type { AppSiteProps } from "../app";
import { createLinguiCatalogLoader } from "../i18n-lingui";
import { LoadingOverlayManager } from "../networking/loading-page";
import { EvictionFreeRouteComponent } from "./routes";

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
        <section>
          <div ref={ref} data-jf-is-noninteractive tabIndex={-1}>
            <LoadingOverlayManager>
              <Route component={EvictionFreeRouteComponent} />
            </LoadingOverlayManager>
          </div>
        </section>
      </EvictionFreeLinguiI18n>
    );
  }
);

export default EvictionFreeSite;
