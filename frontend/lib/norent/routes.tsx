import React from "react";
import { Switch, RouteComponentProps, Route } from "react-router-dom";
import { NorentRoutes as Routes } from "./route-info";
import { NotFound } from "../pages/not-found";
import { NorentHomePage } from "./homepage";
import {
  NorentLetterForUserStaticPage,
  NorentSampleLetterSamplePage,
  NorentLetterEmailToLandlordForUserStaticPage,
} from "./letter-content";
import {
  createHtmlEmailStaticPageRoutes,
  createLetterStaticPageRoutes,
} from "../static-page/routes";
import { NorentFaqsPage } from "./faqs";
import { NorentAboutPage } from "./about";
import { NorentAboutYourLetterPage } from "./the-letter";
import { NorentLetterBuilderRoutes } from "./letter-builder/routes";
import { AlernativeLogoutPage } from "../pages/logout-alt-page";
import { NorentLetterEmailToUserStaticPage } from "./letter-email-to-user";
import loadable from "@loadable/component";
import { friendlyLoad, LoadingPage } from "../networking/loading-page";
import { OneOffEmail } from "./one-off-email";

const LoadableDevRoutes = loadable(
  () => friendlyLoad(import("../dev/routes")),
  {
    fallback: <LoadingPage />,
  }
);

/**
 * This component defines Route components for each main page of the NoRent site.
 * To find the map of each route to its corresponding URL path, check out
 * the `route-info.ts` file in the same directory as this file.
 */
export const NorentRouteComponent: React.FC<RouteComponentProps> = (props) => {
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
      <Route
        path={Routes.locale.logout}
        exact
        component={AlernativeLogoutPage}
      />
      <Route
        path={Routes.locale.letter.prefix}
        component={NorentLetterBuilderRoutes}
      />
      {createLetterStaticPageRoutes(
        Routes.locale.letterContent,
        NorentLetterForUserStaticPage
      )}
      {createHtmlEmailStaticPageRoutes(Routes.locale.oneOffEmail, OneOffEmail)}
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
