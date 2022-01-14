import React from "react";
import { Redirect } from "react-router-dom";
import { MESSAGE_QS } from "../homepage";
import { EvictionFreeRoutes } from "../route-info";

export const EvictionFreeRedirectToHomepage: React.FC<{}> = () => (
  <Redirect to={EvictionFreeRoutes.locale.home} />
);

export const EvictionFreeRedirectToHomepageWithMessage: React.FC<{}> = () => (
  <Redirect to={`${EvictionFreeRoutes.locale.home}?${MESSAGE_QS}`} />
);
