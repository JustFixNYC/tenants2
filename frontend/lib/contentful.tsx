import { Document } from "@contentful/rich-text-types";
import { useContext } from "react";

import { LocaleChoice } from "../../common-data/locale-choices";
import { AppContext } from "./app-context";
import i18n from "./i18n";

export type ContentfulCommonStrings = {
  [key: string]: { [locale in LocaleChoice]: Document | undefined };
};

export function useContentfulCommonString(key: string): Document | null {
  const { contentfulCommonStrings } = useContext(AppContext).server;

  if (!contentfulCommonStrings) return null;

  const locales = contentfulCommonStrings[key];

  return (locales && locales[i18n.locale]) ?? null;
}
