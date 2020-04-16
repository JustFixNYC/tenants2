import React from "react";
import { Route } from "react-router-dom";

type LetterStaticPageRouteInfo = ReturnType<
  typeof createLetterStaticPageRouteInfo
>;

export const createLetterStaticPageRouteInfo = (prefix: string) => ({
  html: `${prefix}.html`,
  pdf: `${prefix}.pdf`,
});

export function createLetterStaticPageRoutes(
  routeInfo: LetterStaticPageRouteInfo,
  render: (isPdf: boolean) => JSX.Element
) {
  return [
    <Route
      key={routeInfo.html}
      path={routeInfo.html}
      exact
      render={() => render(false)}
    />,
    <Route
      key={routeInfo.pdf}
      path={routeInfo.pdf}
      exact
      render={() => render(true)}
    />,
  ];
}
