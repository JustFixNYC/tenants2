import loadable from "@loadable/component";
import React from "react";
import { Route } from "react-router-dom";
import type { AppSiteProps } from "../app";
import { createLinguiCatalogLoader } from "../i18n-lingui";
import { LoadingOverlayManager } from "../networking/loading-page";
import { LALetterBuilderRouteComponent } from "./routes";

export const LALetterBuilderLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(
    () => import("../../../locales/en/laletterbuilder.chunk") as any
  ),
  es: loadable.lib(
    () => import("../../../locales/es/laletterbuilder.chunk") as any
  ),
});

const LALetterBuilderSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    return (
      <LALetterBuilderLinguiI18n>
        <section>
          <div ref={ref} data-jf-is-noninteractive tabIndex={-1}>
            <LoadingOverlayManager>
              <Route component={LALetterBuilderRouteComponent} />
            </LoadingOverlayManager>
          </div>
        </section>
      </LALetterBuilderLinguiI18n>
    );
  }
);

export default LALetterBuilderSite;
