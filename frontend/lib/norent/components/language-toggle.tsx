import React, { useContext } from "react";
import { AppContext } from "../../app-context";
import { LocaleChoice } from "../../../../common-data/locale-choices";
import i18n from "../../i18n";
import { useLocation } from "react-router-dom";
import { NorentRoutes } from "../routes";
import { Trans } from "@lingui/macro";

/**
 * Names of languages in the language itself.
 */
const LANGUAGE_NAMES: { [k in LocaleChoice]: string } = {
  en: "English",
  es: "Español",
};

const SwitchLanguage: React.FC<{ locale: LocaleChoice }> = ({ locale }) => {
  const langName = LANGUAGE_NAMES[locale];
  const location = useLocation();

  if (locale === i18n.locale) return <>{langName}</>;

  const pathname =
    i18n.changeLocalePathPrefix(location.pathname, locale) ||
    NorentRoutes.getLocale(locale).home;

  // Note that this is an <a> rather than a <Link>, because changing
  // the locale requires a full page refresh.
  return <a href={pathname}>{langName}</a>;
};

export const LanguageToggle: React.FC<{}> = () => {
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
