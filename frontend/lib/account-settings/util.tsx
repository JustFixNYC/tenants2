import React from "react";
import { pathWithHash } from "../util/route-util";
import { AccountSettingsRouteInfo } from "./route-info";

export type WithAccountSettingsProps = {
  routes: AccountSettingsRouteInfo;
};

export function makeAccountSettingsSection(
  routes: AccountSettingsRouteInfo,
  name: string,
  hashId: string
) {
  return {
    name,
    hashId,
    homeLink: pathWithHash(routes.home, hashId),
    heading: <h3 id={hashId}>{name}</h3>,
  };
}
