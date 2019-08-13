import React from 'react';
import Routes, { routeMap } from "./routes";
import { Switch, Route, Redirect } from "react-router";
import { friendlyLoad, LoadingPage2 } from './loading-page';
import { Link } from 'react-router-dom';
import Page from './page';
import { withAppContext, AppContextType } from './app-context';
import Helmet from 'react-helmet';
import { QueryLoader } from './query-loader';
import { ExampleQuery } from './queries/ExampleQuery';
import ExampleRadioPage from './pages/example-radio-page';
import { ExampleDataDrivenOnboardingResults } from './pages/example-ddo-results';
import loadable from '@loadable/component';

const LoadableExamplePage2 = loadable(() => friendlyLoad(import('./pages/example-loadable-page-2')), {
  fallback: <LoadingPage2 />
});

const LoadableExamplePage = loadable(() => friendlyLoad(import('./pages/example-loadable-page')), {
  fallback: <LoadingPage2 />
});

const LoadableExampleFormPage = loadable(() => friendlyLoad(import('./pages/example-form-page')), {
  fallback: <LoadingPage2 />
});

const LoadableExampleModalPage = loadable(() => friendlyLoad(import('./pages/example-modal-page')), {
  fallback: <LoadingPage2 />
});

const LoadableExampleLoadingPage = loadable(() => friendlyLoad(import('./pages/example-loading-page')), {
  fallback: <LoadingPage2 />
});

const LoadableClientSideErrorPage = loadable(() => friendlyLoad(import('./pages/example-client-side-error-page')), {
  fallback: <LoadingPage2 />
});

const DevHome = withAppContext((props: AppContextType): JSX.Element => {
  const frontendRouteLinks: JSX.Element[] = [];
  const serverRouteLinks: JSX.Element[] = [];

  for (let entry of Object.entries(props.server)) {
    const [name, path] = entry;
    if (!/URL$/.test(name)) continue;
    serverRouteLinks.push(
      <React.Fragment key={path}>
        <dt className="jf-dev-code">{name}</dt>
        <dd><a href={path} className="jf-dev-code">{path}</a></dd>
      </React.Fragment>
    );
  }

  for (let path of routeMap.nonParameterizedRoutes()) {
    frontendRouteLinks.push(
      <li key={path}>
        <Link to={path} className="jf-dev-code">{path}</Link>
      </li>
    );
  }

  return (
    <Page title="Development tools">
      <div className="content">
        <h1>Development tools</h1>
        <h2>Back-end routes</h2>
        <dl children={[serverRouteLinks]}/>
        <h2>Front-end routes</h2>
        <ol children={[frontendRouteLinks]}/>
      </div>
    </Page>
  );
});

/* istanbul ignore next: this is tested by integration tests. */
const ExampleMetaTagPage = () => <Helmet><meta property="boop" content="hi" /></Helmet>;

/* istanbul ignore next: this is tested by integration tests. */
function ExampleQueryPage(): JSX.Element {
  return (
    <QueryLoader
      query={ExampleQuery}
      input={{input: "blah"}}
      render={(output) => (
        <p>Output of example query is <code>{output.exampleQuery.hello}</code>!</p>
      )}
      loading={(props) => {
        if (props.error) {
          return <p>Alas, an error occurred. <button onClick={props.retry}>Retry</button></p>;
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
       <Route path={Routes.dev.examples.ddo} exact component={ExampleDataDrivenOnboardingResults} />
       <Route path={Routes.dev.examples.redirect} exact render={() => <Redirect to={Routes.locale.home} />} />
       <Route path={Routes.dev.examples.modal} exact component={LoadableExampleModalPage} />
       <Route path={Routes.dev.examples.loadingPage} exact component={LoadableExampleLoadingPage} />
       <Route path={Routes.dev.examples.form} component={LoadableExampleFormPage} />
       <Route path={Routes.dev.examples.radio} component={ExampleRadioPage} />
       <Route path={Routes.dev.examples.loadable} exact component={LoadableExamplePage} />
       <Route path={Routes.dev.examples.loadable2} exact component={LoadableExamplePage2} />
       <Route path={Routes.dev.examples.clientSideError} exact component={LoadableClientSideErrorPage} />
       <Route path={Routes.dev.examples.metaTag} exact component={ExampleMetaTagPage} />
       <Route path={Routes.dev.examples.query} exact component={ExampleQueryPage} />
    </Switch>
  );
}
