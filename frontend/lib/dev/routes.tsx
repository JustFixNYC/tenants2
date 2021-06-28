import React, { useContext } from "react";
import { Switch, Route, Redirect } from "react-router";
import { friendlyLoad, LoadingPage } from "../networking/loading-page";
import { Link } from "react-router-dom";
import Page from "../ui/page";
import { withAppContext, AppContextType, AppContext } from "../app-context";
import { Helmet } from "react-helmet-async";
import { QueryLoader } from "../networking/query-loader";
import { ExampleQuery } from "../queries/ExampleQuery";
import ExampleRadioPage from "./example-radio-page";
import { ExampleDataDrivenOnboardingResults } from "../data-driven-onboarding/example-ddo-results";
import loadable from "@loadable/component";
import {
  ExampleFormPage,
  ExampleFormWithoutRedirectPage,
} from "./example-form-page";
import { StyleGuide } from "./style-guide";
import {
  ExampleStaticPageHTML,
  ExampleStaticPagePDF,
  ExampleStaticPageText,
} from "./example-static-page";
import { ExampleMapboxPage } from "./example-mapbox-page";
import {
  ExamplePageWithAnchors1,
  ExamplePageWithAnchors2,
} from "./example-pages-with-anchors";
import { DemoDeploymentNote } from "../ui/demo-deployment-note";
import { HtmlEmail, EmailCta } from "../static-page/html-email";
import { createHtmlEmailStaticPageRoutes } from "../static-page/routes";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { isStaticPageRoute } from "../util/route-util";

const LoadableExamplePage = loadable(
  () => friendlyLoad(import("./example-loadable-page")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableExampleModalPage = loadable(
  () => friendlyLoad(import("./example-modal-page")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableExampleLoadingPage = loadable(
  () => friendlyLoad(import("./example-loading-page")),
  {
    fallback: <LoadingPage />,
  }
);

const LoadableClientSideErrorPage = loadable(
  () => friendlyLoad(import("./example-client-side-error-page")),
  {
    fallback: <LoadingPage />,
  }
);

const RouteLink: React.FC<{ path: string }> = ({ path }) =>
  isStaticPageRoute(path) ? (
    <a href={path} className="jf-dev-code">
      {path}
    </a>
  ) : (
    <Link to={path} className="jf-dev-code">
      {path}
    </Link>
  );

const DevHome = withAppContext(
  (props: AppContextType): JSX.Element => {
    const frontendRouteLinks: JSX.Element[] = [];
    const serverRouteLinks: JSX.Element[] = [];
    const extraDevLinks: JSX.Element[] = [];

    for (let entry of Object.entries(props.server)) {
      const [name, path] = entry;
      if (!/URL$/.test(name)) continue;
      serverRouteLinks.push(
        <React.Fragment key={path}>
          <dt className="jf-dev-code">{name}</dt>
          <dd>
            <a href={path} className="jf-dev-code">
              {path}
            </a>
          </dd>
        </React.Fragment>
      );
    }

    for (let { name, url } of props.server.extraDevLinks) {
      extraDevLinks.push(
        <li key={name}>
          <a href={url}>{name}</a>
        </li>
      );
    }

    for (let path of props.siteRoutes.routeMap.nonParameterizedRoutes()) {
      const li = (
        <li key={path}>
          <RouteLink path={path} />
        </li>
      );
      if (path.startsWith(props.siteRoutes.dev.prefix)) {
        // No need to add a link to the page we're already on.
        if (path !== props.siteRoutes.dev.home) {
          extraDevLinks.push(li);
        }
      } else {
        frontendRouteLinks.push(li);
      }
    }

    return (
      <Page title="Development tools">
        <DemoDeploymentNote>
          <p>
            This deployment has been flagged as a <strong>demo</strong> so it
            will contain notices like this one.
          </p>
        </DemoDeploymentNote>
        <div className="content">
          <h1>Sundry development tools, documentation, examples, etc.</h1>
          <ol children={[extraDevLinks]} />
          <h2>Front-end routes</h2>
          <ol children={[frontendRouteLinks]} />
          <h2>Back-end routes</h2>
          <dl children={[serverRouteLinks]} />
        </div>
      </Page>
    );
  }
);

/* istanbul ignore next: this is tested by integration tests. */
const ExampleMetaTagPage = () => (
  <Helmet>
    <meta property="boop" content="hi" />
  </Helmet>
);

/* istanbul ignore next: this is tested by integration tests. */
const ExampleIntlPage = () => {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const date = new Date(2020, 4, 27);
  const spanish = new Intl.DateTimeFormat("es", opts);
  const english = new Intl.DateTimeFormat("en", opts);

  return (
    <Page title="Intl test" className="content">
      <p>
        This page tests that the ECMAScript Internationalization API works on
        the server and client.
      </p>
      <dl>
        <dt>English</dt>
        <dd>{english.format(date)}</dd>
        <dt>Spanish</dt>
        <dd>{spanish.format(date)}</dd>
      </dl>
    </Page>
  );
};

/* istanbul ignore next: this is tested by integration tests. */
function ExampleQueryPage(): JSX.Element {
  return (
    <QueryLoader
      query={ExampleQuery}
      input={{ input: "blah" }}
      render={(output) => (
        <p>
          Output of example query is <code>{output.exampleQuery.hello}</code>!
        </p>
      )}
      loading={(props) => {
        if (props.error) {
          return (
            <p>
              Alas, an error occurred.{" "}
              <button onClick={props.retry}>Retry</button>
            </p>
          );
        }
        return <p>Loading&hellip;</p>;
      }}
    />
  );
}

const ExampleHtmlEmailStaticPage = asEmailStaticPage(() => (
  <HtmlEmail
    subject="This is a test HTML email!"
    footer={<p>Here is some footer text.</p>}
  >
    <p>Hi there,</p>
    <p>
      Sometimes you just want to send a simple HTML email with a simple design
      and clear call to action. This is it.
    </p>
    <EmailCta href="https://example.com/">Call To Action</EmailCta>
    <p>
      This is a really simple email template. Its sole purpose is to get the
      recipient to click the button with no distractions.
    </p>
    <p>Good luck! Hope it works.</p>
  </HtmlEmail>
));

export default function DevRoutes(): JSX.Element {
  const { siteRoutes } = useContext(AppContext);
  const dev = siteRoutes.dev;

  return (
    <Switch>
      <Route path={dev.home} exact component={DevHome} />
      <Route path={dev.styleGuide} exact component={StyleGuide} />
      <Route
        path={dev.examples.ddo}
        exact
        component={ExampleDataDrivenOnboardingResults}
      />
      <Route
        path={dev.examples.redirect}
        exact
        render={() => <Redirect to={siteRoutes.locale.home} />}
      />
      <Route
        path={dev.examples.modal}
        exact
        component={LoadableExampleModalPage}
      />
      <Route
        path={dev.examples.loadingPage}
        exact
        component={LoadableExampleLoadingPage}
      />
      <Route path={dev.examples.form} component={ExampleFormPage} />
      <Route
        path={dev.examples.formWithoutRedirect}
        component={ExampleFormWithoutRedirectPage}
      />
      <Route path={dev.examples.radio} component={ExampleRadioPage} />
      <Route
        path={dev.examples.loadable}
        exact
        component={LoadableExamplePage}
      />
      <Route
        path={dev.examples.clientSideError}
        exact
        component={LoadableClientSideErrorPage}
      />
      <Route path={dev.examples.metaTag} exact component={ExampleMetaTagPage} />
      <Route path={dev.examples.query} exact component={ExampleQueryPage} />
      <Route
        path={dev.examples.staticPage}
        exact
        component={ExampleStaticPageHTML}
      />
      <Route
        path={dev.examples.staticPagePdf}
        exact
        component={ExampleStaticPagePDF}
      />
      <Route
        path={dev.examples.staticPageTxt}
        exact
        component={ExampleStaticPageText}
      />
      {createHtmlEmailStaticPageRoutes(
        dev.examples.staticHtmlEmail,
        ExampleHtmlEmailStaticPage
      )}
      <Route
        path={dev.examples.anchors1}
        exact
        component={ExamplePageWithAnchors1}
      />
      <Route
        path={dev.examples.anchors2}
        exact
        component={ExamplePageWithAnchors2}
      />
      <Route path={dev.examples.mapbox} exact component={ExampleMapboxPage} />
      <Route path={dev.examples.intl} exact component={ExampleIntlPage} />
    </Switch>
  );
}
