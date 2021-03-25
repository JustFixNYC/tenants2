import React from "react";
import { Route, Switch } from "react-router";
import JustfixRoutes from "../justfix-route-info";
import LoginPage from "../pages/login-page";
import { FrontappPlugin } from "./frontapp-plugin";
import AdminConversationsRoutes from "./admin-conversations";

const AdminRoutes: React.FC<{}> = () => (
  <Switch>
    <Route
      path={JustfixRoutes.admin.frontappPlugin}
      exact
      component={FrontappPlugin}
    />
    <Route path={JustfixRoutes.admin.login} exact component={LoginPage} />
    <Route
      path={JustfixRoutes.admin.conversations}
      exact
      component={AdminConversationsRoutes}
    />
  </Switch>
);

export default AdminRoutes;
