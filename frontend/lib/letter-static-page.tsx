import React from "react";
import { StaticPage } from "./static-page";
import { LambdaResponseHttpHeaders } from "../lambda/lambda";
import { Route } from "react-router-dom";

type LetterStylesCss = {
  inlinePdfCss: string;
  htmlCssUrls: string[];
};

type LetterStylesProps = {
  css: LetterStylesCss;
  isPdf?: boolean;
};

const LetterStyles: React.FC<LetterStylesProps> = ({ css, isPdf }) =>
  isPdf ? (
    <style children={css.inlinePdfCss} />
  ) : (
    <>
      {css.htmlCssUrls.map((url, i) => [<link rel="stylesheet" href={url} />])}
    </>
  );

const PDF_HEADERS: LambdaResponseHttpHeaders = {
  "Content-Type": "application/pdf",
};

const HTML_HEADERS: LambdaResponseHttpHeaders = {
  "X-Frame-Options": "SAMEORIGIN",
};

export const LetterStaticPage: React.FC<
  LetterStylesProps & { title: string; children: React.ReactChild }
> = ({ isPdf, title, children, css }) => (
  <StaticPage httpHeaders={isPdf ? PDF_HEADERS : HTML_HEADERS}>
    <html>
      <head>
        <meta charSet="utf-8" />
        <LetterStyles css={css} isPdf={isPdf} />
        <title>{title}</title>
      </head>
      <body>{children}</body>
    </html>
  </StaticPage>
);

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
