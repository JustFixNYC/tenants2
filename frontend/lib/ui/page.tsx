import React, { useContext } from "react";
import { Helmet } from "react-helmet-async";
import { AriaAnnouncement } from "./aria";
import classNames from "classnames";
import { AppContext } from "../app-context";
import { SiteChoice } from "../../../common-data/site-choices";

export type HeadingRenderer = (title: string) => JSX.Element;

interface PageProps {
  title: string;
  withHeading?: boolean | "big" | "small" | HeadingRenderer;
  className?: string;
  children?: any;
}

function headingClassName(heading: true | "big" | "small") {
  return classNames("title", heading !== "big" && "is-4");
}

/**
 * Renders the text of the current site, optionally with the
 * text of the current navbar label (e.g. "DEMO SITE").
 */
export const SiteName: React.FC<{
  /**
   * Whether or not to include the navbar label (e.g. "DEMO SITE") in the
   * site name.
   */
  short?: boolean;
}> = (props) => {
  const siteName = useSiteName(props.short);

  return <>{siteName}</>;
};

function getSiteBaseName(siteType: SiteChoice): string {
  switch (siteType) {
    case "JUSTFIX":
      return "JustFix.nyc";

    case "NORENT":
      return "NoRent.org";
  }
}

/**
 * A React Hook that returns the text of the current site, optionally with the
 * text of the current navbar label (e.g. "DEMO SITE").
 */
export function useSiteName(short?: boolean): string {
  const { server } = useContext(AppContext);
  const { navbarLabel, siteType } = server;
  let siteName = getSiteBaseName(siteType);

  if (navbarLabel && !short) {
    siteName += " " + navbarLabel;
  }

  return siteName;
}

export function PageTitle(props: { title: string }): JSX.Element {
  const title = props.title;
  const siteName = useSiteName();
  const fullTitle = title ? `${siteName} - ${title}` : siteName;

  return (
    <>
      <Helmet>
        <title>HELLO {fullTitle}</title>
        <meta property="og:title" content={title} />
        <meta name="twitter:title" content={title} />
      </Helmet>
      <AriaAnnouncement text={title} />
    </>
  );
}

function renderHeading(props: PageProps): JSX.Element | null {
  const { withHeading, title } = props;

  if (!withHeading) return null;

  if (typeof withHeading === "function") {
    return withHeading(title);
  }

  return <h1 className={headingClassName(withHeading)}>{title}</h1>;
}

export default function Page(props: PageProps): JSX.Element {
  // Note that we want to explicitly wrap this in a container
  // element to make CSS transitions possible.
  return (
    <div className={props.className}>
      <PageTitle title={props.title} />
      <p>boop</p>
      {renderHeading(props)}
      {props.children}
    </div>
  );
}
