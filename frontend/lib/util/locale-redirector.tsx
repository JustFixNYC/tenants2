import React, { useContext } from "react";
import { LocaleChoice } from "../../../common-data/locale-choices";
import { Route, Redirect, RouteProps } from "react-router-dom";
import * as H from "history";
import i18n, { SupportedLocale } from "../i18n";
import { RedirectCurrentPathToEnglishPage } from "../pages/redirect-to-english-page";
import { AppContext } from "../app-context";

/**
 * Returns a Route that redirects all requests for the given locale
 * to another locale.
 */
export function createLocaleRedirectorRoute(
  from: LocaleChoice,
  to: LocaleChoice,
  RedirectComponent: React.ComponentType<{
    to: H.LocationDescriptor;
  }> = Redirect
): JSX.Element {
  const fromPath = `/${from}/`;

  return (
    <Route
      path={fromPath}
      render={(props) => {
        const pathname =
          `/${to}/` + props.location.pathname.substring(fromPath.length);

        return <RedirectComponent to={{ ...props.location, pathname }} />;
      }}
    />
  );
}

type ExtraPLRouteProps = {
  locales?: SupportedLocale[];
  wipLocales?: SupportedLocale[];
};

type PLRouteProps = RouteProps & ExtraPLRouteProps;

function isLocaleSupported(
  options: ExtraPLRouteProps & { enableWipLocales: boolean }
): boolean {
  let locales = options.locales || ["en"];

  if (options.enableWipLocales && options.wipLocales) {
    locales = [...locales, ...options.wipLocales];
  }

  return new Set(locales).has(i18n.locale);
}

/** A partially localized route. */
export const PLRoute: React.FC<PLRouteProps> = (props) => {
  const { server } = useContext(AppContext);

  if (isLocaleSupported({ ...server, ...props })) {
    return <Route {...props} />;
  }

  return (
    <Route
      {...props}
      children={undefined}
      render={undefined}
      component={RedirectCurrentPathToEnglishPage}
    />
  );
};

export function toPLRoute(
  el: JSX.Element,
  plProps?: ExtraPLRouteProps
): JSX.Element {
  if (process.env.NODE_ENV !== "production" && el.type !== Route) {
    console.warn("toPLRoute() expected a <Route> JSX Element!");
  }
  const routeProps: RouteProps = el.props;
  return <PLRoute key={el.key ?? undefined} {...routeProps} {...plProps} />;
}
