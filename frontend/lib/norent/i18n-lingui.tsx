import React from "react";
import {
  LoadableCatalog,
  LinguiI18nProps,
  mergeIntoLinguiCatalog,
} from "../i18n-lingui";
import loadable from "@loadable/component";
import i18n, { SupportedLocale } from "../i18n";

const EnCatalog: LoadableCatalog = loadable.lib(
  () => import("../../../locales/en/norent.chunk") as any
);

const EsCatalog: LoadableCatalog = loadable.lib(
  () => import("../../../locales/es/norent.chunk") as any
);

/**
 * Returns a component that loads the Lingui message catalog for
 * the given locale.
 */
function getLinguiCatalogForLanguage(locale: SupportedLocale): LoadableCatalog {
  switch (locale) {
    case "en":
      return EnCatalog;
    case "es":
      return EsCatalog;
  }
}

export const NorentLinguiI18n: React.FC<LinguiI18nProps> = (props) => {
  const locale = i18n.locale;

  const Catalog = getLinguiCatalogForLanguage(locale);

  return (
    <Catalog fallback={<p>Loading locale data...</p>}>
      {(catalog) => {
        mergeIntoLinguiCatalog(locale, catalog);
        return props.children;
      }}
    </Catalog>
  );
};
