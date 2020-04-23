/**
 * Valid HTTP headers to add to lambda responses.
 */
export type LambdaResponseHttpHeaders = {
  /**
   * The content type. It defaults to HTML, so leave it empty if it's not
   * one of the following values.
   */
  "Content-Type"?: "application/pdf"|"text/plain; charset=utf-8";

  /** Controls whether we can embed the content as an IFRAME. */
  "X-Frame-Options"?: "SAMEORIGIN" | "DENY";
};
