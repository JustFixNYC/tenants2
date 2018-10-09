import React from 'react';
import Loadable from 'react-loadable';
import Routes from "./routes";
import { Switch, Route, Redirect } from "react-router";
import { friendlyLoad, LoadingPage } from './loading-page';

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

export default function DevRoutes(): JSX.Element {
  return (
    <Switch>
       <Route path={Routes.dev.examples.redirect} exact render={() => <Redirect to="/" />} />
       <Route path={Routes.dev.examples.modal} exact component={LoadableExampleModalPage} />
       <Route path={Routes.dev.examples.loadingPage} exact component={LoadableExampleLoadingPage} />
       <Route path={Routes.dev.examples.form} exact component={LoadableExampleFormPage} />
       <Route path={Routes.dev.examples.loadable} exact component={LoadableExamplePage} />
       <Route path={Routes.dev.examples.clientSideError} exact component={LoadableClientSideErrorPage} />
    </Switch>
  );
}
