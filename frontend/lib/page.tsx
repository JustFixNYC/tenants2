import React from 'react';
import { Helmet } from "react-helmet";
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
