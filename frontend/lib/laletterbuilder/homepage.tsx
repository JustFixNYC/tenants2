import { Trans } from "@lingui/macro";
import React from "react";
import { Link } from "react-router-dom";
import { LALetterBuilderRoutes } from "./route-info";

export const LALetterBuilderHomepage: React.FC<{}> = () => (
  <>
    <p>
      <Trans>This is a test localization message for LA Letter Builder.</Trans>
    </p>
    <p>
      <Link to={LALetterBuilderRoutes.locale.about}>About page</Link>
    </p>
    <p>
      <Link to={LALetterBuilderRoutes.locale.letter.latestStep}>
        Build your letter
      </Link>
    </p>
    <p>
      {/** This will eventually be replaced by a navbar link. */}
      <Link to={LALetterBuilderRoutes.locale.logout}>Log out</Link>
    </p>
    <p>
      {/** This will eventually be replaced by a navbar link. */}
      <Link to={LALetterBuilderRoutes.dev.home}>Development tools</Link>
    </p>
  </>
);
