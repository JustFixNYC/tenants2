import { getGlobalAppServerInfo } from "../app-context";
import i18n from "../i18n";

export function efnycURL(): string {
  return `${getGlobalAppServerInfo().efnycOrigin}/${i18n.locale}`;
}
