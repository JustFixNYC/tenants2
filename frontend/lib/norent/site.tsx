import React, { useContext } from "react";
import { AppSiteProps } from "../app";
import {
  NorentRoutes as Routes,
  getNorentRoutesForPrimaryPages,
} from "./routes";
import { RouteComponentProps, Switch, Route, Link } from "react-router-dom";
import { NotFound } from "../pages/not-found";
import { NorentHomePage } from "./homepage";
import {
  LoadingPage,
  friendlyLoad,
  LoadingOverlayManager,
} from "../networking/loading-page";
import loadable from "@loadable/component";
import classnames from "classnames";
import { AppContext } from "../app-context";
import { NorentFooter } from "./components/footer";
import {
  NorentLetterForUserStaticPage,
  NorentSampleLetterSamplePage,
  NorentLetterEmailToLandlordForUserStaticPage,
} from "./letter-content";
import Navbar from "../ui/navbar";
import {
  createHtmlEmailStaticPageRoutes,
  createLetterStaticPageRoutes,
} from "../static-page/routes";
import { NorentFaqsPage } from "./faqs";
import { NorentAboutPage } from "./about";
import { NorentAboutYourLetterPage } from "./the-letter";
import { NorentLogo } from "./components/logo";
import { NorentLetterBuilderRoutes } from "./letter-builder/steps";
import { NorentLogoutPage } from "./log-out";
import { NorentHelmet } from "./components/helmet";
import { NorentLetterEmailToUserStaticPage } from "./letter-email-to-user";
import { Trans, t } from "@lingui/macro";
import { LocalizedNationalMetadataProvider } from "./letter-builder/national-metadata";
import { createLinguiCatalogLoader, li18n } from "../i18n-lingui";
import { NavbarLanguageDropdown } from "./components/language-toggle";

function getRoutesForPrimaryPages() {
  return new Set(getNorentRoutesForPrimaryPages());
}

export const NorentLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(() => import("../../../locales/en/norent.chunk") as any),
  es: loadable.lib(() => import("../../../locales/es/norent.chunk") as any),
});

const LoadableDevRoutes = loadable(() => friendlyLoad(import("../dev/dev")), {
  fallback: <LoadingPage />,
});

/**
 * This function defines Route components for each main page of the NoRent site.
 * To find the map of each route to its corresponding URL path, check out
 * the `routes.ts` file in the same directory as this file.
 */
const NorentRoute: React.FC<RouteComponentProps> = (props) => {
  const { location } = props;
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  return (
    <Switch location={location}>
      <Route path={Routes.locale.home} exact component={NorentHomePage} />
      <Route path={Routes.locale.faqs} exact component={NorentFaqsPage} />
      <Route path={Routes.locale.about} exact component={NorentAboutPage} />
      <Route
        path={Routes.locale.aboutLetter}
        exact
        component={NorentAboutYourLetterPage}
      />
      <Route path={Routes.locale.logout} exact component={NorentLogoutPage} />
      <Route
        path={Routes.locale.letter.prefix}
        component={NorentLetterBuilderRoutes}
      />
      {createLetterStaticPageRoutes(
        Routes.locale.letterContent,
        NorentLetterForUserStaticPage
      )}
      <Route
        path={Routes.locale.letterEmail}
        exact
        component={NorentLetterEmailToLandlordForUserStaticPage}
      />
      {createHtmlEmailStaticPageRoutes(
        Routes.locale.letterEmailToUser,
        NorentLetterEmailToUserStaticPage
      )}
      {createLetterStaticPageRoutes(
        Routes.locale.sampleLetterContent,
        NorentSampleLetterSamplePage
      )}
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
};

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
                <Route component={NorentRoute} />
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
