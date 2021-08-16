import React from "react";
import { Redirect } from "react-router-dom";
import { MESSAGE_QS } from "../homepage";
import { EvictionFreeRoutes } from "../route-info";

export const EvictionFreeRedirectToHomepageWithMessage: React.FC<{}> = (
  props
) => <Redirect to={`${EvictionFreeRoutes.locale.home}?${MESSAGE_QS}`} />;
