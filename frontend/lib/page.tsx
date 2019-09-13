import React, { useContext } from 'react';
import { Helmet } from "react-helmet-async";
import { AriaAnnouncement } from './aria';
import classNames from 'classnames';
import { AppContext } from './app-context';

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

export function useSiteName(): string {
  const { navbarLabel } = useContext(AppContext).server;
  let siteName = 'JustFix.nyc';

  if (navbarLabel) {
    siteName += ' ' + navbarLabel;
  }

  return siteName;
}

export function PageTitle(props: {title: string}): JSX.Element {
  const title = props.title;
  const siteName = useSiteName();
  const fullTitle = title ? `${siteName} - ${title}` : siteName;

  return <>
    <Helmet>
      <title>{fullTitle}</title>
    </Helmet>
    <AriaAnnouncement text={title} />
  </>;
}

export default function Page(props: PageProps): JSX.Element {
  const { title, withHeading } = props;

  // Note that we want to explicitly wrap this in a container
  // element to make CSS transitions possible.
  return (
    <div className={props.className}>
      <PageTitle title={title} />
      {withHeading && <h1 className={headingClassName(withHeading)}>{title}</h1>}
      {props.children}
    </div>
  );
}
