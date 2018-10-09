import React from 'react';
import Loadable from 'react-loadable';
import Routes, { ROUTE_PREFIX } from "./routes";
import { Switch, Route, Redirect } from "react-router";
import { friendlyLoad, LoadingPage } from './loading-page';
import { Link } from 'react-router-dom';
import Page from './page';

const LoadableExamplePage = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "example-loadable-page" */ './pages/example-loadable-page')),
  loading: LoadingPage
});

const LoadableExampleFormPage = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "example-form-page" */ './pages/example-form-page')),
  loading: LoadingPage
});

const LoadableExampleModalPage = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "example-modal-page" */ './pages/example-modal-page')),
  loading: LoadingPage
});

const LoadableExampleLoadingPage = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "example-loading-page" */ './pages/example-loading-page')),
  loading: LoadingPage
});

const LoadableClientSideErrorPage = Loadable({
  loader: () => friendlyLoad(import(/* webpackChunkName: "example-client-side-error-page" */ './pages/example-client-side-error-page')),
  loading: LoadingPage
});

function DevHome(): JSX.Element {
  const exampleLinks: JSX.Element[] = [];

  Object.entries(Routes.dev.examples).forEach(([name, path]) => {
    if (name === ROUTE_PREFIX) return;
    exampleLinks.push(<li key={path}><Link to={path}>{name}</Link></li>);
  });

  return (
    <Page title="Development tools">
      <div className="content">
        <h1>Development tools</h1>
        <h2>Examples</h2>
        <ol children={[exampleLinks]}/>
      </div>
    </Page>
  );
}

export default function DevRoutes(): JSX.Element {
  return (
    <Switch>
       <Route path={Routes.dev.home} exact component={DevHome} />
       <Route path={Routes.dev.examples.redirect} exact render={() => <Redirect to="/" />} />
       <Route path={Routes.dev.examples.modal} exact component={LoadableExampleModalPage} />
       <Route path={Routes.dev.examples.loadingPage} exact component={LoadableExampleLoadingPage} />
       <Route path={Routes.dev.examples.form} exact component={LoadableExampleFormPage} />
       <Route path={Routes.dev.examples.loadable} exact component={LoadableExamplePage} />
       <Route path={Routes.dev.examples.clientSideError} exact component={LoadableClientSideErrorPage} />
    </Switch>
  );
}
