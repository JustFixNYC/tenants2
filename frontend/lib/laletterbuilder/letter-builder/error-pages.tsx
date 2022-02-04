import React from "react";

import { AlreadyLoggedInErrorPage } from "../../common-steps/error-pages";
import { LaLetterBuilderRouteInfo } from "../route-info";

export const LaLetterBuilderAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <AlreadyLoggedInErrorPage
    continueUrl={LaLetterBuilderRouteInfo.locale.habitability.latestStep}
  />
);
