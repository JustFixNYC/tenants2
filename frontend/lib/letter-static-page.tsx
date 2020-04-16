import React from "react";
import { StaticPage } from "./static-page";
import { LambdaResponseHttpHeaders } from "../lambda/lambda";

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
  "Content-Type": "text/html",
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
