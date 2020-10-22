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
import JustfixRoutes from "./justfix-routes";
import { OnboardingInfoSignupIntent } from "./queries/globalTypes";
import { getOnboardingRouteForIntent } from "./onboarding/signup-intent";
import HelpPage from "./pages/help-page";
import { createRedirectWithSearch } from "./util/redirect-util";
import MoratoriumBanner from "./ui/covid-banners";
import { AppSiteProps } from "./app";
import { Footer } from "./ui/footer";
import { JustfixNavbar } from "./justfix-navbar";
import { PLRoute, toPLRoute } from "./pages/redirect-to-english-page";

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

const LoadableFrontappPluginRoutes = loadable(
  () => friendlyLoad(import("./admin/frontapp-plugin")),
  {
    fallback: <LoadingPage />,
  }
);

const JustfixRoute: React.FC<RouteComponentProps> = (props) => {
  const { location } = props;
  const { server, session } = useContext(AppContext);
  if (!JustfixRoutes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  const enableEHP = server.enableEmergencyHPAction;
  const redirectToEHP =
    enableEHP &&
    !(session.onboardingInfo?.signupIntent === OnboardingInfoSignupIntent.HP);

  return (
    <Switch location={location}>
      <Route
        path={JustfixRoutes.locale.home}
        exact
        component={LoadableDataDrivenOnboardingPage}
      />
      <PLRoute path={JustfixRoutes.locale.help} component={HelpPage} />
      <Route
        path={JustfixRoutes.locale.legacyDataDrivenOnboarding}
        exact
        component={createRedirectWithSearch(JustfixRoutes.locale.home)}
      />
      <PLRoute path={JustfixRoutes.locale.login} exact component={LoginPage} />
      <Route
        path={JustfixRoutes.adminFrontappPlugin}
        exact
        component={LoadableFrontappPluginRoutes}
      />
      <Route path={JustfixRoutes.adminLogin} exact component={LoginPage} />
      <Route
        path={JustfixRoutes.adminConversations}
        exact
        component={LoadableAdminConversationsRoutes}
      />
      <PLRoute
        path={JustfixRoutes.locale.logout}
        exact
        component={LogoutPage}
      />
      {toPLRoute(getOnboardingRouteForIntent(OnboardingInfoSignupIntent.LOC))}
      <PLRoute
        path={JustfixRoutes.locale.loc.prefix}
        component={LoadableLetterOfComplaintRoutes}
      />
      {redirectToEHP && (
        <Route
          path={JustfixRoutes.locale.hp.splash}
          exact
          render={() => <Redirect to={JustfixRoutes.locale.ehp.splash} />}
        />
      )}
      {redirectToEHP && (
        <Route
          path={JustfixRoutes.locale.hp.welcome}
          exact
          render={() => <Redirect to={JustfixRoutes.locale.ehp.welcome} />}
        />
      )}
      {toPLRoute(getOnboardingRouteForIntent(OnboardingInfoSignupIntent.HP))}
      <PLRoute
        path={JustfixRoutes.locale.hp.prefix}
        component={LoadableHPActionRoutes}
      />
      {enableEHP &&
        toPLRoute(getOnboardingRouteForIntent(OnboardingInfoSignupIntent.EHP))}
      {enableEHP && (
        <PLRoute
          path={JustfixRoutes.locale.ehp.prefix}
          component={LoadableEmergencyHPActionRoutes}
        />
      )}
      <Route
        path={JustfixRoutes.locale.rh.prefix}
        component={LoadableRentalHistoryRoutes}
      />
      <Route path={JustfixRoutes.dev.prefix} component={LoadableDevRoutes} />
      <PLRoute
        path={JustfixRoutes.locale.dataRequests.prefix}
        component={LoadableDataRequestsRoutes}
      />
      <PLRoute
        path={JustfixRoutes.locale.passwordReset.prefix}
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
