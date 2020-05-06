import React, { useMemo } from "react";
import { Catalog } from "@lingui/core";
import loadable, { LoadableLibrary } from "@loadable/component";
import { I18nProvider } from "@lingui/react";
import i18n, { SupportedLocale } from "./i18n";
import { setupI18n as linguiSetupI18n } from "@lingui/core";

/**
 * We use code splitting to make sure that we only load the message
 * catalog needed for our currently selected locale.
 *
 * This defines the type of component whose children prop is a
 * callable that receives a Lingui message catalog as its only
 * argument.
 */
export type LoadableCatalog = LoadableLibrary<Catalog>;

const EnCatalog: LoadableCatalog = loadable.lib(
  () => import("../../locales/en/messages") as any
);

const EsCatalog: LoadableCatalog = loadable.lib(
  () => import("../../locales/es/messages") as any
);

/**
 * Returns a component that loads the Lingui message catalog for
 * the given string.
 */
function getLinguiCatalogForLanguage(locale: SupportedLocale): LoadableCatalog {
  switch (locale) {
    case "en":
      return EnCatalog;
    case "es":
      return EsCatalog;
  }
}

const SetupI18n: React.FC<
  LinguiI18nProps & {
    locale: string;
    catalog: Catalog;
  }
> = (props) => {
  const { locale, catalog } = props;

  // This useMemo() call might be overkill. -AV
  const ourLinguiI18n = useMemo(() => {
    li18n.load({
      [locale]: catalog,
    });
    li18n.activate(locale);
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
 * Loads the Lingui message catalog for the currently selected
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

  const Catalog = getLinguiCatalogForLanguage(locale);

  return (
    <Catalog fallback={<p>Loading locale data...</p>}>
      {(catalog) => <SetupI18n {...props} locale={locale} catalog={catalog} />}
    </Catalog>
  );
};

/**
 * A global instance of Lingui's I18n object, which can be used to perform
 * localization outside of React JSX. Note that this object is populated
 * by the <LinguiI18n> component, however, so it should only really be
 * used by components that exist below it in the hierarchy.
 */
export const li18n = linguiSetupI18n();
