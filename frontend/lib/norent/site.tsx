import React, { useContext } from "react";
import { AppSiteProps } from "../app";
import { NorentRoutes as Routes } from "./routes";
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
} from "./letter-content";
import Navbar from "../ui/navbar";
import { createLetterStaticPageRoutes } from "../static-page/routes";
import { NorentFaqsPage } from "./faqs";
import { NorentInfoPage } from "./info";
import { NorentAboutYourLetterPage } from "./about-your-letter";
import { NorentLogo } from "./components/logo";
import { NorentLetterBuilderRoutes } from "./letter-builder/steps";

function getRoutesForPrimaryPages() {
  return new Set([
    Routes.locale.home,
    Routes.locale.about,
    Routes.locale.faqs,
    Routes.locale.aboutLetter,
  ]);
}

const LoadableDevRoutes = loadable(() => friendlyLoad(import("../dev/dev")), {
  fallback: <LoadingPage />,
});

const NorentRoute: React.FC<RouteComponentProps> = (props) => {
  const { location } = props;
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  return (
    <Switch location={location}>
      <Route path={Routes.locale.home} exact component={NorentHomePage} />
      <Route path={Routes.locale.faqs} exact component={NorentFaqsPage} />
      <Route path={Routes.locale.about} exact component={NorentInfoPage} />
      <Route
        path={Routes.locale.aboutLetter}
        exact
        component={NorentAboutYourLetterPage}
      />
      <Route
        path={Routes.locale.letter.prefix}
        component={NorentLetterBuilderRoutes}
      />
      {createLetterStaticPageRoutes(Routes.locale.letterContent, (isPdf) => (
        <NorentLetterForUserStaticPage isPdf={isPdf} />
      ))}
      {createLetterStaticPageRoutes(
        Routes.locale.sampleLetterContent,
        (isPdf) => (
          <NorentSampleLetterSamplePage isPdf={isPdf} />
        )
      )}
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
};

const NorentBrand: React.FC<{}> = () => (
  <Link className="navbar-item" to={Routes.locale.home}>
    <NorentLogo size="is-96x96" />
  </Link>
);

const NorentMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  return (
    <>
      <Link className="navbar-item" to={Routes.locale.aboutLetter}>
        The Letter
      </Link>
      <Link className="navbar-item" to={Routes.locale.letter.latestStep}>
        Build my Letter
      </Link>
      <Link className="navbar-item" to={Routes.locale.faqs}>
        Faqs
      </Link>
      <Link className="navbar-item" to={Routes.locale.about}>
        About
      </Link>
      {session.phoneNumber ? (
        // These are placeholders just to show styling.
        // Will replace when we have site scaffolding ready.
        <Link className="navbar-item" to={Routes.locale.home}>
          Log out
        </Link>
      ) : (
        <Link className="navbar-item" to={Routes.locale.home}>
          Log in
        </Link>
      )}
    </>
  );
};

const NorentSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    const isPrimaryPage = getRoutesForPrimaryPages().has(
      props.location.pathname
    );
    return (
      <>
        <section
          className={classnames(
            "section",
            "jf-above-footer-content",
            isPrimaryPage && "is-paddingless"
          )}
        >
          <Navbar
            menuItemsComponent={NorentMenuItems}
            brandComponent={NorentBrand}
          />
          <div
            className={classnames(!isPrimaryPage && "container")}
            ref={ref}
            data-jf-is-noninteractive
            tabIndex={-1}
          >
            <LoadingOverlayManager>
              <Route component={NorentRoute} />
            </LoadingOverlayManager>
          </div>
        </section>
        <NorentFooter />
      </>
    );
  }
);

export default NorentSite;
