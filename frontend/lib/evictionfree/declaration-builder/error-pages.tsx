import React from "react";
import { AlreadyLoggedInErrorPage } from "../../common-steps/error-pages";
import { EvictionFreeRoutes } from "../route-info";

export const EvictionFreeAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <AlreadyLoggedInErrorPage
    continueUrl={EvictionFreeRoutes.locale.declaration.latestStep}
  />
);
