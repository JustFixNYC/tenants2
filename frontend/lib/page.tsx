import React from 'react';
import { Helmet } from "react-helmet";
import { AriaAnnouncement } from './aria';

interface PageProps {
  title: string;
  children?: any;
}

export default function Page(props: PageProps): JSX.Element {
  // Note that we want to explicitly wrap this in a container
  // element to make CSS transitions possible.
  return (
    <div>
      <Helmet>
        <title>JustFix.nyc - {props.title}</title>
      </Helmet>
      <AriaAnnouncement text={props.title} />
      {props.children}
    </div>
  );
}
