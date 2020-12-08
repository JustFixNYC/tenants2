import { getGlobalAppServerInfo } from "../app-context";
import i18n from "../i18n";

export function efnycURL(): string {
  const efnycLocale = i18n.locale === "en" ? "en-us" : i18n.locale;
  return `${getGlobalAppServerInfo().efnycOrigin}/${efnycLocale}`;
}
