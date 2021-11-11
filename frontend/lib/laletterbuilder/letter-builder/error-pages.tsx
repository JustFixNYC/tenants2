import React from "react";
import { AlreadyLoggedInErrorPage } from "../../common-steps/error-pages";
import { LALetterBuilderRoutes } from "../route-info";

export const LALetterBuilderAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <AlreadyLoggedInErrorPage
    continueUrl={LALetterBuilderRoutes.locale.letter.latestStep}
  />
);
