import { Document } from "@contentful/rich-text-types";
import { ContentfulCommonStrings } from "@justfixnyc/contentful-common-strings";
import { useContext } from "react";

import { AppContext } from "./app-context";
import i18n from "./i18n";

export function useContentfulCommonString(key: string): Document | null {
  const ccs = new ContentfulCommonStrings(
    useContext(AppContext).server.contentfulCommonStrings || {}
  );

  return ccs.get(key, i18n.locale);
}
