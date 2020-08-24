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

type HtmlEmailStaticPageRouteInfo = ReturnType<
  typeof createHtmlEmailStaticPageRouteInfo
>;

/**
 * Route information about the HTML and plaintext versions of an
 * email. For example, if passed "/boop", it will represent
 * routes for "/boop.html" and "/boop.txt".
 */
export const createHtmlEmailStaticPageRouteInfo = (prefix: string) => ({
  html: `${prefix}.html`,
  txt: `${prefix}.txt`,
});

export function createHtmlEmailStaticPageRoutes(
  routeInfo: HtmlEmailStaticPageRouteInfo,
  Component: React.ComponentType<{ isHtmlEmail?: boolean }>
) {
  return [
    <Route
      key={routeInfo.html}
      path={routeInfo.html}
      exact
      render={() => <Component isHtmlEmail={true} />}
    />,
    <Route
      key={routeInfo.txt}
      path={routeInfo.txt}
      exact
      render={() => <Component isHtmlEmail={false} />}
    />,
  ];
}
