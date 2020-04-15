import React, { useEffect } from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { getAppStaticContext } from "../app-static-context";

type StaticPageProps = { children: JSX.Element };

const StaticPage = withRouter(
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
    }
    return null;
  }
);

export const ExampleStaticPage: React.FC<{}> = () => (
  <StaticPage>
    <html>
      {/* Yes, this is valid HTML5. */}
      <meta charSet="utf-8" />
      <title>This is an example static page.</title>
      <p>Hello, this is an example static page&hellip;</p>
    </html>
  </StaticPage>
);
