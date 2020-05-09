import React, { useContext } from "react";
import { Switch, Route, RouteComponentProps, Redirect } from "react-router-dom";
import loadable from "@loadable/component";

import { AppContext } from "./app-context";
import { NotFound } from "./pages/not-found";
import {
  friendlyLoad,
  LoadingOverlayManager,
  LoadingPage,
} from "./networking/loading-page";
import LoginPage from "./pages/login-page";
import { LogoutPage } from "./pages/logout-page";
import Routes from "./justfix-routes";
import { OnboardingInfoSignupIntent } from "./queries/globalTypes";
import { getOnboardingRouteForIntent } from "./onboarding/signup-intent";
import HelpPage from "./pages/help-page";
import { createRedirectWithSearch } from "./util/redirect-util";
import MoratoriumBanner from "./ui/covid-banners";
import { AppSiteProps } from "./app";
import { Footer } from "./ui/footer";
import { JustfixNavbar } from "./justfix-navbar";

const LoadableDataDrivenOnboardingPage = loadable(
  () => friendlyLoad(import("./data-driven-onboarding/data-driven-onboarding")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadablePasswordResetRoutes = loadable(
  () => friendlyLoad(import("./pages/password-reset")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableLetterOfComplaintRoutes = loadable(
  () => friendlyLoad(import("./loc/letter-of-complaint")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableHPActionRoutes = loadable(
  () => friendlyLoad(import("./hpaction/hp-action")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableEmergencyHPActionRoutes = loadable(
  () => friendlyLoad(import("./hpaction/emergency-hp-action")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableRentalHistoryRoutes = loadable(
  () => friendlyLoad(import("./rh/rental-history")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableDevRoutes = loadable(() => friendlyLoad(import("./dev/dev")), {
  fallback: <LoadingPage />,
});

const LoadableDataRequestsRoutes = loadable(
  () => friendlyLoad(import("./data-requests/data-requests")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableAdminConversationsRoutes = loadable(
  () => friendlyLoad(import("./admin/admin-conversations")),
  {
    fallback: <LoadingPage />,
  }
);

const JustfixRoute: React.FC<RouteComponentProps> = (props) => {
  const { location } = props;
  const { server, session } = useContext(AppContext);
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  const enableEHP = server.enableEmergencyHPAction;
  const redirectToEHP =
    enableEHP &&
    !(session.onboardingInfo?.signupIntent === OnboardingInfoSignupIntent.HP);

  return (
    <Switch location={location}>
      <Route
        path={Routes.locale.home}
        exact
        component={LoadableDataDrivenOnboardingPage}
      />
      <Route path={Routes.locale.help} component={HelpPage} />
      <Route
        path={Routes.locale.legacyDataDrivenOnboarding}
        exact
        component={createRedirectWithSearch(Routes.locale.home)}
      />
      <Route path={Routes.locale.login} exact component={LoginPage} />
      <Route path={Routes.adminLogin} exact component={LoginPage} />
      <Route
        path={Routes.adminConversations}
        exact
        component={LoadableAdminConversationsRoutes}
      />
      <Route path={Routes.locale.logout} exact component={LogoutPage} />
      {getOnboardingRouteForIntent(OnboardingInfoSignupIntent.LOC)}
      <Route
        path={Routes.locale.loc.prefix}
        component={LoadableLetterOfComplaintRoutes}
      />
      {redirectToEHP && (
        <Route
          path={Routes.locale.hp.splash}
          exact
          render={() => <Redirect to={Routes.locale.ehp.splash} />}
        />
      )}
      {redirectToEHP && (
        <Route
          path={Routes.locale.hp.welcome}
          exact
          render={() => <Redirect to={Routes.locale.ehp.welcome} />}
        />
      )}
      {getOnboardingRouteForIntent(OnboardingInfoSignupIntent.HP)}
      <Route
        path={Routes.locale.hp.prefix}
        component={LoadableHPActionRoutes}
      />
      {enableEHP && getOnboardingRouteForIntent(OnboardingInfoSignupIntent.EHP)}
      {enableEHP && (
        <Route
          path={Routes.locale.ehp.prefix}
          component={LoadableEmergencyHPActionRoutes}
        />
      )}
      <Route
        path={Routes.locale.rh.prefix}
        component={LoadableRentalHistoryRoutes}
      />
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route
        path={Routes.locale.dataRequests.prefix}
        component={LoadableDataRequestsRoutes}
      />
      <Route
        path={Routes.locale.passwordReset.prefix}
        component={LoadablePasswordResetRoutes}
      />
      <Route render={NotFound} />
    </Switch>
  );
};

const JustfixSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    return (
      <>
        <div className="jf-above-footer-content">
          <JustfixNavbar />
          <MoratoriumBanner pathname={props.location.pathname} />
          <section className="section">
            <div
              className="container"
              ref={ref}
              data-jf-is-noninteractive
              tabIndex={-1}
            >
              <LoadingOverlayManager>
                <Route component={JustfixRoute} />
              </LoadingOverlayManager>
            </div>
          </section>
        </div>
        <Footer pathname={props.location.pathname} />
      </>
    );
  }
);

export default JustfixSite;
