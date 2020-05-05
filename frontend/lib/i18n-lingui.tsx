import React, { useMemo } from "react";
import { Catalog } from "@lingui/core";
import loadable, { LoadableLibrary } from "@loadable/component";
import { I18nProvider } from "@lingui/react";
import i18n from "./i18n";
import { setupI18n as linguiSetupI18n } from "@lingui/core";

export type LoadableCatalog = LoadableLibrary<Catalog>;

const EnCatalog: LoadableCatalog = loadable.lib(
  () => import("../../locales/en/messages") as any
);

const EsCatalog: LoadableCatalog = loadable.lib(
  () => import("../../locales/es/messages") as any
);

function getLinguiCatalogForLanguage(locale: string): LoadableCatalog {
  switch (locale) {
    case "en":
      return EnCatalog;
    case "es":
      return EsCatalog;
  }
  throw new Error(`Unsupported locale "${locale}"`);
}

type LinguiI18nProps = {
  children: React.ReactNode;
};

const SetupI18n: React.FC<
  LinguiI18nProps & {
    locale: string;
    catalog: Catalog;
  }
> = (props) => {
  const { locale, catalog } = props;
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

export const LinguiI18n: React.FC<LinguiI18nProps> = (props) => {
  const locale = i18n.locale;

  const Catalog = getLinguiCatalogForLanguage(locale);

  return (
    <Catalog>
      {(catalog) => <SetupI18n {...props} locale={locale} catalog={catalog} />}
    </Catalog>
  );
};

export const li18n = linguiSetupI18n();
