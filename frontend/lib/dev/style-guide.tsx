import React, { useContext } from "react";
import Page from "../ui/page";
import { Link } from "react-router-dom";
import { AppContext } from "../app-context";
import {
  NextButton,
  BackButton,
  CenteredPrimaryButtonLink,
} from "../ui/buttons";
import { BigList } from "../ui/big-list";
import { StaticImage } from "../ui/static-image";
import { Accordion } from "../ui/accordion";

const PathLink: React.FC<{ to: string }> = ({ to }) => (
  <Link to={to}>{to}</Link>
);

export const StyleGuide: React.FC<{}> = () => {
  const { dev } = useContext(AppContext).siteRoutes;

  return (
    <Page title="Style guide" withHeading="big" className="content">
      <p>Here is a rough style guide for the site.</p>
      <h2>Buttons</h2>
      <p>
        The centered primary button link can be used for major calls to action.
      </p>
      <CenteredPrimaryButtonLink to={dev.home}>
        Centered primary button link
      </CenteredPrimaryButtonLink>
      <p>
        The back button can be used to go back to the previous step of a
        process.
      </p>
      <p>
        <BackButton to={dev.home} />
      </p>
      <p>
        The next button can be used to submit the current form. It also has a
        loading state.
      </p>
      <p>
        <NextButton isLoading={false} /> <NextButton isLoading={true} />
      </p>
      <h2>Forms</h2>
      <p>
        For examples of how forms look, see <PathLink to={dev.examples.form} />{" "}
        and <PathLink to={dev.examples.radio} />.
      </p>
      <h2>Accordions</h2>
      <Accordion question="This is an accordion question">
        This is an accordion answer.
      </Accordion>
      <h2>Modals</h2>
      <p>
        See <PathLink to={dev.examples.modal} />.
      </p>
      <h2>Big list</h2>
      <BigList>
        <li>Here is item one.</li>
        <li>Here is item two.</li>
      </BigList>
    </Page>
  );
};
