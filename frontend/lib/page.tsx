import React from 'react';
import { Helmet } from "react-helmet";
import { AriaAnnouncement } from './aria';
import { WhenNotUnloading } from './loading-page';

interface PageProps {
  title: string;
  children?: any;
}

export default function Page(props: PageProps): JSX.Element {
  return (
    <React.Fragment>
      <WhenNotUnloading>
        <Helmet>
          <title>JustFix.nyc - {props.title}</title>
        </Helmet>
        <AriaAnnouncement text={props.title} />
      </WhenNotUnloading>
      {props.children}
    </React.Fragment>
  );
}
