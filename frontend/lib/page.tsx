import React from 'react';
import { Helmet } from "react-helmet";
import Loadable from 'react-loadable';
import { AriaAnnouncement } from './aria';

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
      <AriaAnnouncement text={props.title} />
      {props.children}
    </React.Fragment>
  );
}

export function LoadingPage(props: Loadable.LoadingComponentProps): JSX.Element {
  if (props.error) {
    return (
      <Page title="Network error">
        <p>Unfortunately, a network error occurred.</p>
        <br/>
        <button className="button" onClick={props.retry}>Retry</button>
      </Page>
    );
  }
  return <Page title="Loading...">Loading...</Page>;
}
