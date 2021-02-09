import { Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  EvictionFreeUnsupportedLocaleChoices,
  getEvictionFreeUnsupportedLocaleChoiceLabels,
} from "../../../../common-data/evictionfree-unsupported-locale-choices";
import { AppContext } from "../../app-context";
import { SwitchLanguage } from "../../ui/language-toggle";
import { LegalDisclaimer } from "../../ui/legal-disclaimer";
import { EvictionFreeRoutes } from "../route-info";

export const EvictionFreeFooterLanguageToggle: React.FC<{}> = () => {
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
        {EvictionFreeUnsupportedLocaleChoices.map((locale) => (
          <li key={locale}>
            <Link to={EvictionFreeRoutes.unsupportedLocale[locale]}>
              {getEvictionFreeUnsupportedLocaleChoiceLabels()[locale]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const EvictionFreeFooter: React.FC<{}> = () => (
  <footer>
    <div className="container has-background-dark">
      <div className="columns">
        <div className="column is-8">
          <div className="content is-size-7">
            <EvictionFreeFooterLanguageToggle />
            <LegalDisclaimer website="EvictionFreeNY.org" />
            <p>
              <Trans>Photo credits:</Trans> Scott Heins, Right to Counsel
              Coalition, Brian Giacchetto
            </p>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
