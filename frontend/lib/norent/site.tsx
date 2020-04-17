import React, { useContext } from "react";
import { AppSiteProps } from "../app";
import { NorentRoutes as Routes, NorentRoutes } from "./routes";
import { RouteComponentProps, Switch, Route, Link } from "react-router-dom";
import { NotFound } from "../pages/not-found";
import { NorentHomepage } from "./homepage";
import {
  LoadingPage,
  friendlyLoad,
  LoadingOverlayManager,
} from "../networking/loading-page";
import loadable from "@loadable/component";
import classnames from "classnames";
import { NorentLetterRoutes } from "./letter-builder";
import { AppContext } from "../app-context";
import { NorentFooter } from "./components/footer";
import {
  NorentLetterForUserStaticPage,
  NorentSampleLetterSamplePage,
} from "./letter-content";
import Navbar from "../ui/navbar";
import { createLetterStaticPageRoutes } from "../static-page/routes";

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
      <Route path={Routes.locale.home} exact component={NorentHomepage} />
      <Route
        path={Routes.locale.letter.prefix}
        component={NorentLetterRoutes}
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

const NorentMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  // These are placeholders just to show styling.
  // Will replace when we have site scaffolding ready.
  return (
    <>
      <Link className="navbar-item" to={Routes.locale.letter.latestStep}>
        Build my letter
      </Link>
      <Link className="navbar-item" to={Routes.locale.home}>
        Faqs
      </Link>
      <Link className="navbar-item" to={Routes.locale.home}>
        About
      </Link>
      {session.phoneNumber ? (
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
    const isLandingPage = props.location.pathname === NorentRoutes.locale.home;
    return (
      <>
        <section
          className={classnames(
            "section",
            "jf-above-footer-content",
            isLandingPage && "is-paddingless"
          )}
        >
          <Navbar menuItemsComponent={NorentMenuItems} />
          <div
            className={classnames(!isLandingPage && "container")}
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
