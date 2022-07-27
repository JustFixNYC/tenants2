import React from "react";

import { useContext } from "react";
import { AppContext } from "../app-context";
import { useLocation, Redirect } from "react-router-dom";
import { getGlobalSiteRoutes } from "../global-site-routes";

/**
 * This ensures that the page it's embedded in requires login
 * to view.
 *
 * If the user isn't logged in at the time this component
 * is rendered, they will be redirected to login, and sent back
 * to the original page after they log in.
 *
 * If the user is logged in, the children of this component are rendered.
 */
export const RequireLogin: React.FC<{ children: JSX.Element }> = (props) => {
  const { session } = useContext(AppContext);
  const routes = getGlobalSiteRoutes();
  const next = useLocation();

  if (!session.phoneNumber && routes.locale.createLoginLink) {
    return (
      <Redirect
        to={routes.locale.createLoginLink(next, routes.locale.prefix)}
      />
    );
  }

  return props.children;
};
