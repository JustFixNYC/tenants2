import React from 'react';
import { Helmet } from "react-helmet";
import Navbar from './navbar';
import Loadable from 'react-loadable';

interface PageProps {
  title: string;
  children?: any;
}

export default function Page(props: PageProps): JSX.Element {
  return (
    <React.Fragment>
      <Helmet>
        <title>JustFix.nyc - {props.title}</title>
      </Helmet>
      {props.children}
    </React.Fragment>
  );
}

export function LoadingPage(props: Loadable.LoadingComponentProps): JSX.Element {
  if (props.error) {
    return (
      <Page title="Network error">
        <p>Unfortunately, a network error occurred.</p>
        <button className="button" onClick={props.retry}>Retry</button>
      </Page>
    );
  }
  return <Page title="Loading...">Loading...</Page>;
}
