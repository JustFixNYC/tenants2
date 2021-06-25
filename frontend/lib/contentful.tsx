import { Document } from "@contentful/rich-text-types";
import { ContentfulCommonStrings } from "@justfixnyc/contentful-common-strings";
import { useContext } from "react";

import { AppContext } from "./app-context";
import i18n from "./i18n";

/**
 * Retrieve a common string (one shared across multiple JustFix properties)
 * in the current locale from Contentful and return it.
 *
 * If the string doesn't exist or Contentful integration is disabled,
 * `null` will be returned.
 */
export function useContentfulCommonString(key: string): Document | null {
  const ccs = new ContentfulCommonStrings(
    useContext(AppContext).server.contentfulCommonStrings || {}
  );

  return ccs.get(key, i18n.locale);
}
