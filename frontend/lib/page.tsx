import React from 'react';
import { Helmet } from "react-helmet";
import { AriaAnnouncement } from './aria';
import classNames from 'classnames';

interface PageProps {
  title: string;
  withHeading?: boolean|'big'|'small';
  className?: string;
  children?: any;
}

function headingClassName(heading: true|'big'|'small') {
  return classNames(
    'title',
    heading !== 'big' && 'is-4'
  );
}

export default function Page(props: PageProps): JSX.Element {
  const { title, withHeading } = props;

  // Note that we want to explicitly wrap this in a container
  // element to make CSS transitions possible.
  return (
    <div className={props.className}>
      <Helmet>
        <title>JustFix.nyc - {title}</title>
      </Helmet>
      <AriaAnnouncement text={title} />
      {withHeading && <h1 className={headingClassName(withHeading)}>{title}</h1>}
      {props.children}
    </div>
  );
}
