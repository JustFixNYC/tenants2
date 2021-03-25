import { getGlobalAppServerInfo } from "../app-context";
import i18n from "../i18n";

export function evictionfreeURL(): string {
  const evictionfreeLocale = i18n.locale === "en" ? "en-us" : i18n.locale;
  return `${getGlobalAppServerInfo().evictionfreeOrigin}/${evictionfreeLocale}`;
}
