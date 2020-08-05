import React, { useContext } from "react";
import { RouteComponentProps, Redirect } from "react-router-dom";
import { AppContext } from "../app-context";
import JustfixRoutes from "../justfix-routes";
import { createLoginPageSearch } from "../pages/login-page";

/**
 * Require that anyone visiting the wrapped component have staff (i.e., admin) permission.
 *
 * If they don't, redirect them to the admin login page; once they're logged in, they will
 * be redirected to the current page.
 */
export function staffOnlyView<P extends RouteComponentProps>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const StaffOnlyRedirector: React.FC<P> = (props) => {
    const appCtx = useContext(AppContext);
    if (!appCtx.session.isStaff) {
      const search = createLoginPageSearch({ next: props.location });
      return <Redirect to={{ pathname: JustfixRoutes.adminLogin, search }} />;
    }
    return <Component {...props} />;
  };

  return StaffOnlyRedirector;
}
