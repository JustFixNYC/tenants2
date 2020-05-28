import React from "react";
import { LocaleChoice } from "../../../common-data/locale-choices";
import { Route, Redirect } from "react-router-dom";

export function createLocaleRedirectorRoute(
  from: LocaleChoice,
  to: LocaleChoice
): JSX.Element {
  const fromPath = `/${from}/`;

  return (
    <Route
      path={fromPath}
      render={(props) => {
        const pathname =
          `/${to}/` + props.location.pathname.substring(fromPath.length);

        return <Redirect to={{ ...props.location, pathname }} />;
      }}
    />
  );
}
