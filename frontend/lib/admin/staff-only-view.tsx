import React, { useContext } from "react";
import { RouteComponentProps, Redirect } from "react-router-dom";
import { AppContext } from "../app-context";
import JustfixRoutes from "../justfix-route-info";

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
      return (
        <Redirect
          to={JustfixRoutes.admin.createAdminLoginLink(props.location)}
        />
      );
    }
    return <Component {...props} />;
  };

  return StaffOnlyRedirector;
}
