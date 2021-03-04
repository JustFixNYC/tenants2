import React, { useContext } from "react";
import { pathWithHash } from "../util/route-util";
import { AccountSettingsRouteInfo } from "./route-info";

export type AccountSettingsContextType = {
  routes: AccountSettingsRouteInfo;
};

export const AccountSettingsContext = React.createContext<
  AccountSettingsContextType
>({
  get routes(): AccountSettingsRouteInfo {
    throw new Error("AccountSettingsContext not set!");
  },
});

export function useAccountSettingsSectionInfo(name: string, hashId: string) {
  const { routes } = useContext(AccountSettingsContext);
  return {
    name,
    hashId,
    homeLink: pathWithHash(routes.home, hashId),
    heading: <h3 id={hashId}>{name}</h3>,
  };
}
