import React from "react";
import { Route } from "react-router-dom";

type LetterStaticPageRouteInfo = ReturnType<
  typeof createLetterStaticPageRouteInfo
>;

/**
 * Route information about the HTML and PDF versions of a
 * letter. For example, if passed "/boop", it will represent
 * routes for "/boop.html" and "/boop.pdf".
 */
export const createLetterStaticPageRouteInfo = (prefix: string) => ({
  html: `${prefix}.html`,
  pdf: `${prefix}.pdf`,
});

/**
 * Creates routes for the rendering of the HTML and PDF versions
 * of a letter.
 */
export function createLetterStaticPageRoutes(
  routeInfo: LetterStaticPageRouteInfo,
  Component: React.ComponentType<{ isPdf: boolean }>
) {
  return [
    <Route
      key={routeInfo.html}
      path={routeInfo.html}
      exact
      render={() => <Component isPdf={false} />}
    />,
    <Route
      key={routeInfo.pdf}
      path={routeInfo.pdf}
      exact
      render={() => <Component isPdf={true} />}
    />,
  ];
}
