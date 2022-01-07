import React from "react";

import { AlreadyLoggedInErrorPage } from "../../common-steps/error-pages";
import { LaLetterBuilderRoutes } from "../route-info";

export const LaLetterBuilderAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <AlreadyLoggedInErrorPage
    continueUrl={LaLetterBuilderRoutes.locale.letter.latestStep}
  />
);
