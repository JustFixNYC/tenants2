import React from "react";
import { makeAppLocation } from "../app-location";
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
    homeLocation: makeAppLocation({
      pathname: routes.home,
      hash: hashId,
      state: {
        noScroll: true,
        noFocus: true,
      },
    }),
    heading: (
      <h3 id={hashId} className="jf-account-settings-h3">
        {name}
      </h3>
    ),
  };
}
