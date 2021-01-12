import { Trans } from "@lingui/macro";
import React from "react";
import { Link } from "react-router-dom";
import { EvictionFreeRoutes } from "./route-info";

export const EvictionFreeHomePage: React.FC<{}> = () => (
  <>
    <p>
      <Trans>This is a test localization message for EvictionFree.</Trans>
    </p>
    <p>
      <Link to={EvictionFreeRoutes.locale.declaration.latestStep}>
        Build your declaration
      </Link>
    </p>
    <p>
      {/** This will eventually be replaced by a navbar link. */}
      <Link to={EvictionFreeRoutes.locale.logout}>Log out</Link>
    </p>
    <p>
      {/** This will eventually be replaced by a navbar link. */}
      <Link to={EvictionFreeRoutes.dev.home}>Development tools</Link>
    </p>
  </>
);
