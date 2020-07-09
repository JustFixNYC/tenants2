import { useEffect } from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { getAppStaticContext } from "../app-static-context";
import { LambdaResponseHttpHeaders } from "../../lambda/lambda-response-http-headers";

export type StaticPageProps = {
  /** HTTP headers to pass on to our upstream client. */
  httpHeaders?: LambdaResponseHttpHeaders;

  /** Whether to inline `<style>` CSS into the HTML for this page. */
  shouldInlineCss?: boolean;

  /** The static HTML content for this page. */
  children: JSX.Element;
};

/**
 * A <StaticPage> represents a web page of completely self-contained HTML
 * that isn't progressively enhanced in any way. Almost all components that
 * use this should pass an <html> element as a child.
 *
 * The primary use case for this component is for content that isn't
 * intended for use in a browser, but rather for alternate media
 * such as a PDF (via WeasyPrint) or richly-formatted HTML email.
 *
 * Using this element will actually *not* render anything above it in
 * the component heirarchy. If it's visited via a <Link> or any other
 * pushState-based mechanism, it will cause a hard refresh on the user's
 * browser.
 */
export const StaticPage = withRouter(
  (props: RouteComponentProps & StaticPageProps) => {
    // If the user got here through a <Link> or other type of
    // dynamic redirect, we want to trigger a page reload so
    // that our static content is rendered server-side. However,
    // we also want to ensure that if the user presses the
    // back button on their browser, it triggers a hard redirect/reload
    // instead of a popstate event (which won't do anything because
    // we're a static page without any JS).  So we'll add a
    // querystring to trigger this.
    //
    // Note that the following querystring should never actually
    // be included in a <Link> on the site, or we'll break the user's
    // browsing history.
    useEffect(() => window.location.replace("?staticView"));

    const staticCtx = getAppStaticContext(props);
    if (staticCtx) {
      staticCtx.staticContent = props.children;
      if (props.httpHeaders) {
        Object.assign(staticCtx.httpHeaders, props.httpHeaders);
      }
      staticCtx.shouldInlineCss = props.shouldInlineCss;
    }
    return null;
  }
);
