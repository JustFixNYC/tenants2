import React from "react";
import Routes from "../routes";
import { Switch, Route, Redirect } from "react-router";
import { friendlyLoad, LoadingPage } from "../networking/loading-page";
import { Link } from "react-router-dom";
import Page from "../ui/page";
import { withAppContext, AppContextType } from "../app-context";
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

const DevHome = withAppContext(
  (props: AppContextType): JSX.Element => {
    const frontendRouteLinks: JSX.Element[] = [];
    const serverRouteLinks: JSX.Element[] = [];

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

    for (let path of Routes.routeMap.nonParameterizedRoutes()) {
      frontendRouteLinks.push(
        <li key={path}>
          <Link to={path} className="jf-dev-code">
            {path}
          </Link>
        </li>
      );
    }

    return (
      <Page title="Development tools">
        <div className="content">
          <h1>Development tools</h1>
          <h2>Back-end routes</h2>
          <dl children={[serverRouteLinks]} />
          <h2>Front-end routes</h2>
          <ol children={[frontendRouteLinks]} />
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

export default function DevRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.dev.home} exact component={DevHome} />
      <Route
        path={Routes.dev.examples.ddo}
        exact
        component={ExampleDataDrivenOnboardingResults}
      />
      <Route
        path={Routes.dev.examples.redirect}
        exact
        render={() => <Redirect to={Routes.locale.home} />}
      />
      <Route
        path={Routes.dev.examples.modal}
        exact
        component={LoadableExampleModalPage}
      />
      <Route
        path={Routes.dev.examples.loadingPage}
        exact
        component={LoadableExampleLoadingPage}
      />
      <Route path={Routes.dev.examples.form} component={ExampleFormPage} />
      <Route
        path={Routes.dev.examples.formWithoutRedirect}
        component={ExampleFormWithoutRedirectPage}
      />
      <Route path={Routes.dev.examples.radio} component={ExampleRadioPage} />
      <Route
        path={Routes.dev.examples.loadable}
        exact
        component={LoadableExamplePage}
      />
      <Route
        path={Routes.dev.examples.clientSideError}
        exact
        component={LoadableClientSideErrorPage}
      />
      <Route
        path={Routes.dev.examples.metaTag}
        exact
        component={ExampleMetaTagPage}
      />
      <Route
        path={Routes.dev.examples.query}
        exact
        component={ExampleQueryPage}
      />
    </Switch>
  );
}
