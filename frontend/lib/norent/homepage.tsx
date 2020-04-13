import React from "react";
import Page from "../ui/page";
import { Link } from "react-router-dom";
import { NorentRoutes } from "./routes";

export const NorentHomepage: React.FC<{}> = () => (
  <Page title="NoRent.org" withHeading="big" className="content">
    <p>Hello, this is the no rent site.</p>
    <p>
      Not much is here right now, but you can visit the{" "}
      <Link to={NorentRoutes.dev.styleGuide}>style guide</Link>.
    </p>
  </Page>
);
