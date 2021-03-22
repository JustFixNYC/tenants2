import React, { useContext } from "react";
import { AppSiteProps } from "../app";
import {
  NorentRoutes as Routes,
  getNorentRoutesForPrimaryPages,
} from "./route-info";
import { Route, Link } from "react-router-dom";
import { LoadingOverlayManager } from "../networking/loading-page";
import loadable from "@loadable/component";
import classnames from "classnames";
import { AppContext } from "../app-context";
import { NorentFooter } from "./components/footer";
import Navbar from "../ui/navbar";
import { NorentLogo } from "./components/logo";
import { NorentHelmet } from "./components/helmet";
import { Trans, t } from "@lingui/macro";
import { LocalizedNationalMetadataProvider } from "./letter-builder/national-metadata";
import { createLinguiCatalogLoader, li18n } from "../i18n-lingui";
import { NavbarLanguageDropdown } from "../ui/language-toggle";
import { NorentRouteComponent } from "./routes";

function getRoutesForPrimaryPages() {
  return new Set(getNorentRoutesForPrimaryPages());
}

export const NorentLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(() => import("../../../locales/en/norent.chunk") as any),
  es: loadable.lib(() => import("../../../locales/es/norent.chunk") as any),
});

const NorentMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  return (
    <>
      <Link className="navbar-item" to={Routes.locale.letter.latestStep}>
        <Trans>Build my Letter</Trans>
      </Link>
      <Link className="navbar-item" to={Routes.locale.aboutLetter}>
        <Trans>The Letter</Trans>
      </Link>
      <Link className="navbar-item" to={Routes.locale.faqs}>
        <Trans>Faqs</Trans>
      </Link>
      <Link className="navbar-item" to={Routes.locale.about}>
        <Trans>About</Trans>
      </Link>
      {session.phoneNumber ? (
        <Link className="navbar-item" to={Routes.locale.logout}>
          <Trans>Log out</Trans>
        </Link>
      ) : (
        <Link className="navbar-item" to={Routes.locale.letter.phoneNumber}>
          <Trans>Log in</Trans>
        </Link>
      )}
      <NavbarLanguageDropdown />
    </>
  );
};

const NorentSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    const isPrimaryPage = getRoutesForPrimaryPages().has(
      props.location.pathname
    );

    const NorentBrand: React.FC<{}> = () => (
      <Link className="navbar-item" to={Routes.locale.home}>
        <NorentLogo
          size="is-96x96"
          color={isPrimaryPage ? "default" : "white"}
          children={li18n._(t`Homepage`)}
        />
      </Link>
    );
    return (
      <NorentLinguiI18n>
        <section
          className={classnames(
            isPrimaryPage
              ? "jf-above-footer-content"
              : "jf-norent-internal-above-footer-content"
          )}
        >
          <span className={classnames(isPrimaryPage && "jf-white-navbar")}>
            <Navbar
              menuItemsComponent={NorentMenuItems}
              brandComponent={NorentBrand}
            />
            <NorentHelmet />
          </span>
          {!isPrimaryPage && (
            <div className="jf-block-of-color-in-background" />
          )}
          <div
            className={classnames(
              !isPrimaryPage && "box jf-norent-builder-page"
            )}
            ref={ref}
            data-jf-is-noninteractive
            tabIndex={-1}
          >
            <LoadingOverlayManager>
              <LocalizedNationalMetadataProvider>
                <Route component={NorentRouteComponent} />
              </LocalizedNationalMetadataProvider>
            </LoadingOverlayManager>
          </div>
        </section>
        <NorentFooter />
      </NorentLinguiI18n>
    );
  }
);

export default NorentSite;
