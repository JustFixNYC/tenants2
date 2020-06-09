import React from "react";
import { StaticPage } from "./static-page";
import { LambdaResponseHttpHeaders } from "../../lambda/lambda-response-http-headers";
import i18n from "../i18n";
import { QueryLoader } from "../networking/query-loader";
import { LetterStylesQuery } from "../queries/LetterStylesQuery";

type LetterStylesCss = {
  /** Inline CSS to embed when generating PDFs from HTML. */
  inlinePdfCss: string;

  /** A list of stylesheet URLs to include in the HTML version of a letter. */
  htmlCssUrls: string[];
};

type LetterStylesProps = {
  /** The styling for the letter. */
  css: LetterStylesCss;

  /** Whether the letter is to be rendered as a PDF or HTML. */
  isPdf?: boolean;
};

/**
 * The HTML elements inside the <head> element that declare the
 * styling for a business letter.
 */
const LetterStyles: React.FC<LetterStylesProps> = ({ css, isPdf }) =>
  isPdf ? (
    <style dangerouslySetInnerHTML={{ __html: css.inlinePdfCss }} />
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

/**
 * A static HTML page representing a business letter, which can be rendererd
 * either as a static web page or a PDF (via WeasyPrint).
 */
export const LetterStaticPage: React.FC<
  LetterStylesProps & { title: string; children: React.ReactChild }
> = ({ isPdf, title, children, css }) => (
  <StaticPage httpHeaders={isPdf ? PDF_HEADERS : HTML_HEADERS}>
    <html lang={i18n.locale}>
      <head>
        <meta charSet="utf-8" />
        <LetterStyles css={css} isPdf={isPdf} />
        <title>{title}</title>
      </head>
      <body>{children}</body>
    </html>
  </StaticPage>
);

export function createLetterStaticPageWithQuery<T>(
  Component: React.ComponentType<T>
): React.FC<{ isPdf: boolean; title: string } & T> {
  return (props) => (
    <QueryLoader
      query={LetterStylesQuery}
      render={(output) => {
        return (
          <LetterStaticPage
            title={props.title}
            isPdf={props.isPdf}
            css={output.letterStyles}
          >
            <Component {...props} />
          </LetterStaticPage>
        );
      }}
      input={null}
      loading={() => null}
    />
  );
}
