import classnames from "classnames";
import React, { useContext } from "react";
import { useLocation, Route, Link } from "react-router-dom";

import { Trans } from "@lingui/macro";
import loadable from "@loadable/component";

import { AppContext } from "../app-context";
import { createLinguiCatalogLoader } from "../i18n-lingui";
import { LoadingOverlayManager } from "../networking/loading-page";
import { NavbarLanguageDropdown } from "../ui/language-toggle";
import { LaLetterBuilderFooter } from "./components/footer";
import {
  LaLetterBuilderRouteInfo as Routes,
  getLaLetterBuilderRoutesForPrimaryPages,
} from "./route-info";
import { LaLetterBuilderRouteComponent } from "./routes";

import type { AppSiteProps } from "../app";
import { StaticImage } from "../ui/static-image";
import { getLaLetterBuilderImageSrc } from "./homepage";
import Navbar from "../ui/navbar";

export const LaLetterBuilderLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(
    () => import("../../../locales/en/laletterbuilder.chunk") as any
  ),
  es: loadable.lib(
    () => import("../../../locales/es/laletterbuilder.chunk") as any
  ),
});

function useIsPrimaryPage() {
  const location = useLocation();
  return getLaLetterBuilderRoutesForPrimaryPages().includes(location.pathname);
}

const LaLetterBuilderBrand: React.FC<{}> = () => {
  return (
    <Link
      className="navbar-item jf-laletterbuilder-logo"
      to={Routes.locale.home}
    >
      <StaticImage
        ratio="is-128x128"
        src={getLaLetterBuilderImageSrc("justfix-new-logo")}
        alt="JustFix"
      />
    </Link>
  );
};

const LaLetterBuilderMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  return (
    <>
      <Link className="navbar-item" to={Routes.locale.habitability.latestStep}>
        Build my letter
      </Link>
      {session.phoneNumber ? (
        <Link className="navbar-item" to={Routes.locale.logout}>
          <Trans>Log out</Trans>
        </Link>
      ) : (
        <Link
          className="navbar-item"
          to={Routes.locale.habitability.phoneNumber}
        >
          <Trans>Log in</Trans>
        </Link>
      )}
      <NavbarLanguageDropdown />
    </>
  );
};

const LaLetterBuilderSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    const isPrimaryPage = useIsPrimaryPage();

    return (
      <LaLetterBuilderLinguiI18n>
        <section
          className={classnames(
            isPrimaryPage
              ? "jf-above-footer-content"
              : "jf-norent-internal-above-footer-content"
          )}
        >
          <Navbar
            menuItemsComponent={LaLetterBuilderMenuItems}
            brandComponent={LaLetterBuilderBrand}
            dropdownMenuLabel="Menu"
          />

          <div
            ref={ref}
            data-jf-is-noninteractive
            tabIndex={-1}
            className={classnames(
              !isPrimaryPage && "box jf-norent-builder-page"
            )}
          >
            <LoadingOverlayManager>
              <Route component={LaLetterBuilderRouteComponent} />
            </LoadingOverlayManager>
          </div>
        </section>
        <LaLetterBuilderFooter />
      </LaLetterBuilderLinguiI18n>
    );
  }
);

export default LaLetterBuilderSite;
