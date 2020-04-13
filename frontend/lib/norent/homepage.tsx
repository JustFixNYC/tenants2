import React from "react";
import Page from "../ui/page";
import { Link } from "react-router-dom";
import { NorentRoutes } from "./routes";

export const NorentHomepage: React.FC<{}> = () => (
  <Page title="NoRent.org" withHeading="big" className="content">
    <p>Hello, this is the no rent site.</p>
    <p>Not much is here right now, but you can visit these pages:</p>
    <ul>
      <li>
        <Link to={NorentRoutes.dev.styleGuide}>Style guide</Link>
      </li>
      <li>
        <Link to={NorentRoutes.locale.tenantInfo}>Tenant info form</Link>
      </li>
      <li>
        <Link to={NorentRoutes.locale.landlordInfo}>Landlord info form</Link>
      </li>
    </ul>
  </Page>
);
