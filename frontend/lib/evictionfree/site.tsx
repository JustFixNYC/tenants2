import loadable from "@loadable/component";
import React, { useContext } from "react";
import { Link, Route, useLocation } from "react-router-dom";
import type { AppSiteProps } from "../app";
import { createLinguiCatalogLoader } from "../i18n-lingui";
import { LoadingOverlayManager } from "../networking/loading-page";
import { EvictionFreeRouteComponent } from "./routes";
import {
  EvictionFreeRoutes as Routes,
  getEvictionFreeRoutesForPrimaryPages,
} from "./route-info";
import Navbar from "../ui/navbar";
import { AppContext } from "../app-context";
import { Trans } from "@lingui/macro";
import { NavbarLanguageDropdown } from "../ui/language-toggle";
import classnames from "classnames";
import { EvictionFreeFooter } from "./components/footer";

export const EvictionFreeLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(
    () => import("../../../locales/en/evictionfree.chunk") as any
  ),
  es: loadable.lib(
    () => import("../../../locales/es/evictionfree.chunk") as any
  ),
});

function useIsPrimaryPage() {
  const location = useLocation();
  return getEvictionFreeRoutesForPrimaryPages().includes(location.pathname);
}

const EvictionFreeBrand: React.FC<{}> = () => {
  return (
    <Link className="navbar-item" to={Routes.locale.home}>
      <span className="jf-evictionfree-logo">Eviction Free</span>
    </Link>
  );
};

const EvictionFreeMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  return (
    <>
      <Link className="navbar-item" to={Routes.locale.declaration.latestStep}>
        Build my declaration
      </Link>
      {session.phoneNumber ? (
        <Link className="navbar-item" to={Routes.locale.logout}>
          <Trans>Log out</Trans>
        </Link>
      ) : (
        <Link
          className="navbar-item"
          to={Routes.locale.declaration.phoneNumber}
        >
          <Trans>Log in</Trans>
        </Link>
      )}
      <NavbarLanguageDropdown />
    </>
  );
};

const EvictionFreeSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    const isPrimaryPage = useIsPrimaryPage();

    return (
      <EvictionFreeLinguiI18n>
        <section
          className={classnames(
            isPrimaryPage
              ? "jf-above-footer-content"
              : "jf-norent-internal-above-footer-content"
          )}
        >
          <span className={classnames(isPrimaryPage && "jf-white-navbar")}>
            <Navbar
              menuItemsComponent={EvictionFreeMenuItems}
              brandComponent={EvictionFreeBrand}
            />
          </span>
          {!isPrimaryPage && (
            <div className="jf-block-of-color-in-background" />
          )}
          <div
            ref={ref}
            data-jf-is-noninteractive
            tabIndex={-1}
            className={classnames(
              !isPrimaryPage && "box jf-norent-builder-page"
            )}
          >
            <LoadingOverlayManager>
              <Route component={EvictionFreeRouteComponent} />
            </LoadingOverlayManager>
          </div>
        </section>
        <EvictionFreeFooter />
      </EvictionFreeLinguiI18n>
    );
  }
);

export default EvictionFreeSite;
