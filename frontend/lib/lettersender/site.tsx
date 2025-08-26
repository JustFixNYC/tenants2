import classnames from "classnames";
import React, { useContext } from "react";
import { useLocation, Route, Link } from "react-router-dom";

import { t, Trans } from "@lingui/macro";
import i18n from "../i18n";
import loadable from "@loadable/component";

import { AppContext } from "../app-context";
import { createLinguiCatalogLoader, li18n } from "../i18n-lingui";
import { LoadingOverlayManager } from "../networking/loading-page";
import { LANGUAGE_NAMES, NavbarLanguageDropdown } from "../ui/language-toggle";
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
import { Helmet } from "react-helmet-async";

const HeaderArrowIcon = () => (
  <div className="jf-lettersender-header-arrow-icon">
    <StaticImage
      ratio="is-16x16"
      src={getLaLetterBuilderImageSrc("header-arrow")}
      alt=""
    />
  </div>
);

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
      className="navbar-item jf-lettersender-logo"
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

const LaLetterBuilderSignInButton: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  return session.phoneNumber ? (
    <Link className="navbar-item" to={Routes.locale.logout}>
      <StaticImage
        ratio="is-24x24"
        src={getLaLetterBuilderImageSrc("person")}
        alt=""
      />
      <Trans>Sign out</Trans>
      <HeaderArrowIcon />
    </Link>
  ) : (
    <Link className="navbar-item" to={Routes.locale.habitability.phoneNumber}>
      <StaticImage
        ratio="is-24x24"
        src={getLaLetterBuilderImageSrc("person")}
        alt=""
      />
      <Trans>Sign in</Trans>
      <HeaderArrowIcon />
    </Link>
  );
};

const LaLetterBuilderMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  return (
    <>
      <Link className="navbar-item" to={Routes.locale.habitability.latestStep}>
        <Trans>Build my letter</Trans>
      </Link>
      <span className="is-hidden-mobile">
        {session.phoneNumber ? (
          <Link className="navbar-item" to={Routes.locale.logout}>
            <Trans>Sign out</Trans>
          </Link>
        ) : (
          <Link
            className="navbar-item"
            to={Routes.locale.habitability.phoneNumber}
          >
            <Trans>Sign in</Trans>
          </Link>
        )}
      </span>
      <span className="is-hidden-mobile">
        <NavbarLanguageDropdown />
      </span>
      {session.phoneNumber && (
        <Link className="navbar-item" to={Routes.locale.accountSettings.home}>
          <Trans>Account settings</Trans>
        </Link>
      )}
    </>
  );
};

const LaLetterBuilderSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    const { session, server } = useContext(AppContext);
    const isPrimaryPage = useIsPrimaryPage();
    const activeLocale = i18n.locale;

    return (
      <LaLetterBuilderLinguiI18n>
        {!server.isDemoDeployment && !session.isStaff && (
          <Helmet>
            {server.latacGtmId && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${server.latacGtmId}`}
                ></script>
                <script>
                  {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-XZ8F9J2RWJ');`}
                </script>
              </>
            )}
            {server.latacFacebookPixelId && (
              <meta
                name="facebook-domain-verification"
                content={server.latacFacebookPixelId}
              />
            )}
          </Helmet>
        )}
        <section
          className={classnames(
            "jf-site-lettersender",
            isPrimaryPage
              ? "jf-above-footer-content"
              : "jf-norent-internal-above-footer-content",
            session.isSafeModeEnabled ? "jf-safe-mode" : ""
          )}
        >
          <div className="jf-lettersender-top-nav is-touch">
            <Navbar
              menuItemsComponent={NavbarLanguageDropdown}
              brandComponent={LaLetterBuilderSignInButton}
              dropdownMenuLabel={
                <>
                  <StaticImage
                    ratio="is-24x24"
                    src={getLaLetterBuilderImageSrc("globe")}
                    alt=""
                  />
                  {LANGUAGE_NAMES[activeLocale]}
                  <HeaderArrowIcon />
                </>
              }
            />
          </div>
          <Navbar
            menuItemsComponent={LaLetterBuilderMenuItems}
            brandComponent={LaLetterBuilderBrand}
            dropdownMenuLabel={li18n._(t`Menu`)}
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
