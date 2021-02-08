import React, { useContext } from "react";
import { AppContext } from "../app-context";
import { LocaleChoice } from "../../../common-data/locale-choices";
import i18n from "../i18n";
import { useLocation } from "react-router-dom";
import { Trans } from "@lingui/macro";
import { NavbarDropdown } from "./navbar";
import { getGlobalSiteRoutes } from "../global-site-routes";

/**
 * Names of languages in the language itself.
 */
const LANGUAGE_NAMES: { [k in LocaleChoice]: string } = {
  en: "English",
  es: "Español",
};

const SwitchLanguage: React.FC<{
  locale: LocaleChoice;
  className?: string;
  children?: React.ReactNode;
}> = (props) => {
  const { locale } = props;
  const langName = props.children || LANGUAGE_NAMES[locale];
  const location = useLocation();

  if (locale === i18n.locale) return <>{langName}</>;

  const pathname =
    i18n.changeLocalePathPrefix(location.pathname, locale) ||
    getGlobalSiteRoutes().getLocale(locale).home;

  // Note that this is an <a> rather than a <Link>, because changing
  // the locale requires a full page refresh.
  return (
    <a href={pathname} className={props.className}>
      {langName}
    </a>
  );
};

export const FooterLanguageToggle: React.FC<{}> = () => {
  const { server } = useContext(AppContext);

  if (server.enabledLocales.length === 1) return null;

  return (
    <div className="jf-language-toggle">
      <Trans>Language:</Trans>{" "}
      <ul>
        {server.enabledLocales.map((locale) => (
          <li key={locale}>
            <SwitchLanguage locale={locale} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export const NavbarLanguageDropdown: React.FC<{}> = () => {
  const { server } = useContext(AppContext);
  const locales = server.enabledLocales;
  const activeLocale = i18n.locale;

  if (locales.length === 1) return null;

  return (
    <NavbarDropdown id="locale" label={LANGUAGE_NAMES[activeLocale]}>
      {locales
        .filter((locale) => locale !== activeLocale)
        .map((locale) => (
          <SwitchLanguage
            key={locale}
            locale={locale}
            className="navbar-item"
          />
        ))}
    </NavbarDropdown>
  );
};
