import React from "react";
import Page from "../ui/page";
import { Link } from "react-router-dom";

const LoremIpsum: React.FC<{}> = () => (
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
);

const LotsOfSections: React.FC<{prefix: string, count: number, otherURL: string}> = ({prefix, count, otherURL}) => {
  const sections: JSX.Element[] = [];
  for (let i = 1; i <= count; i++) {
    const id = `heading-${i}`
    sections.push(<h2 key={id}><Link to={`#${id}`} id={id}>{prefix}, heading {i}</Link></h2>);
    sections.push(<LoremIpsum key={`ipsum-${i}`} />);
    sections.push(<p key={`link-${i}`}><Link to={`${otherURL}#${id}`}>Link to the other page</Link></p>);
  }
  return <>{sections}</>;
};

export const ExamplePageWithAnchors1: React.FC<{}> = () => {
  return <Page title="Example page with anchors one" className="content">
    <LotsOfSections prefix="Page one" count={10} otherURL={"./two"} />
  </Page>
};

export const ExamplePageWithAnchors2: React.FC<{}> = () => {
  return <Page title="Example page with anchors two" className="content">
    <LotsOfSections prefix="Page two" count={10} otherURL={"./one"} />
  </Page>
};
