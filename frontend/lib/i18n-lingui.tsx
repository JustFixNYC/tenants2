import React, { useMemo } from "react";
import { Catalog } from "@lingui/core";
import loadable, { LoadableLibrary } from "@loadable/component";
import { I18nProvider } from "@lingui/react";
import i18n, { SupportedLocale } from "./i18n";
import { setupI18n as linguiSetupI18n, Catalogs } from "@lingui/core";

/**
 * We use code splitting to make sure that we only load message
 * catalogs needed for our currently selected locale.
 *
 * This defines the type of component whose children prop is a
 * callable that receives a Lingui message catalog as its only
 * argument.
 */
export type LoadableCatalog = LoadableLibrary<Catalog>;

/**
 * Maps supported locales to components that load a Lingui message
 * catalog for them.
 */
export type LinguiCatalogMap = {
  [k in SupportedLocale]: LoadableCatalog;
};

/**
 * The "base" catalog, which contains the most common strings.
 */
const BaseCatalogMap: LinguiCatalogMap = {
  en: loadable.lib(() => import("../../locales/en/base.chunk") as any),
  es: loadable.lib(() => import("../../locales/es/base.chunk") as any),
};

const SetupI18n: React.FC<
  LinguiI18nProps & {
    locale: SupportedLocale;
    catalog: Catalog;
  }
> = (props) => {
  const { locale, catalog } = props;

  // This useMemo() call might be overkill. -AV
  const ourLinguiI18n = useMemo(() => {
    mergeIntoLinguiCatalog(locale, catalog);
    return li18n;
  }, [locale, catalog]);

  return (
    <I18nProvider language={locale} i18n={ourLinguiI18n}>
      {props.children}
    </I18nProvider>
  );
};

export type LinguiI18nProps = {
  /** Children to render once localization data is loaded. */
  children: React.ReactNode;
};

/**
 * Loads the Lingui base message catalog for the currently selected
 * locale, as dictated by our global i18n module. Children
 * will then be rendered with the catalog loaded and ready
 * to translate.
 *
 * While a loading message will appear while the catalog is being loaded,
 * because we do server-side rendering and pre-load JS bundles in the
 * server-rendered HTML output, the user won't see the message most
 * (possibly all) of the time.
 *
 * Note that this component is currently a singleton; more than one
 * instance of it should never exist in a component tree at once.
 */
export const LinguiI18n: React.FC<LinguiI18nProps> = (props) => {
  const locale = i18n.locale;
  const Catalog = BaseCatalogMap[locale];

  return (
    <Catalog fallback={<p>Loading locale data...</p>}>
      {(catalog) => <SetupI18n {...props} locale={locale} catalog={catalog} />}
    </Catalog>
  );
};

/**
 * Creates a component that will load an auxiliary message catalog for
 * Lingui in the currently selected locale, as dictated by our global i18n module.
 */
export function createLinguiCatalogLoader(
  catalogMap: LinguiCatalogMap
): React.FC<LinguiI18nProps> {
  return (props) => {
    const locale = i18n.locale;
    const Catalog = catalogMap[locale];

    return (
      <Catalog fallback={<p>Loading locale data...</p>}>
        {(catalog) => {
          mergeIntoLinguiCatalog(locale, catalog);
          return props.children;
        }}
      </Catalog>
    );
  };
}

/**
 * A global instance of Lingui's I18n object, which can be used to perform
 * localization outside of React JSX. Note that this object is populated
 * by the <LinguiI18n> component, however, so it should only really be
 * used by components that exist below it in the hierarchy.
 */
export const li18n = linguiSetupI18n();

/**
 * Internal global we maintain to keep track of all the messages we
 * can translate across our various catalog chunks.
 */
const catalogs: Catalogs = {};

/**
 * Merge the given catalog for the given locale into our global
 * catalog and activate the locale (if it's not already active).
 */
function mergeIntoLinguiCatalog(locale: SupportedLocale, catalog: Catalog) {
  const emptyCatalog: Catalog = { messages: {} };
  const currentCatalog: Catalog = catalogs[locale] || emptyCatalog;
  catalogs[locale] = {
    languageData: catalog.languageData,
    messages: {
      ...currentCatalog.messages,
      ...catalog.messages,
    },
  };
  li18n.load(catalogs);
  li18n.activate(locale);
}
