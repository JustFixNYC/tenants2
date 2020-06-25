import React, { useContext } from "react";
import Page from "../ui/page";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import * as H from "history";
import {
  useHistory,
  RouteComponentProps,
  Route,
  RouteProps,
} from "react-router-dom";
import i18n, { SupportedLocale } from "../i18n";
import { AppContext } from "../app-context";

export const RedirectToEnglishPage: React.FC<{ to: H.LocationDescriptor }> = (
  props
) => {
  const history = useHistory();
  const href =
    typeof props.to === "string" ? props.to : history.createHref(props.to);
  const title = li18n._(
    t`The webpage that you want to access is only available in English.`
  );

  return (
    <Page title={title} withHeading="big" className="content">
      <p className="has-text-centered">
        <a href={href} className="button is-primary is-large jf-is-extra-wide">
          <Trans>Got it, take me there</Trans>
        </a>
      </p>
    </Page>
  );
};

export const RedirectCurrentPathToEnglishPage: React.FC<RouteComponentProps> = ({
  location,
}) => {
  const pathname = i18n.changeLocalePathPrefix(location.pathname, "en");
  if (!pathname)
    throw new Error(`Path ${location.pathname} is not locale-prefixed!`);
  return <RedirectToEnglishPage to={{ ...location, pathname }} />;
};

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
