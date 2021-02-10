import { Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { EvictionFreeUnsupportedLocaleChoices } from "../../../../common-data/evictionfree-unsupported-locale-choices";
import { AppContext } from "../../app-context";
import { SwitchLanguage } from "../../ui/language-toggle";
import { LegalDisclaimer } from "../../ui/legal-disclaimer";
import { useEvictionFreeUnsupportedLocale } from "../route-info";
import { SwitchToUnsupportedLanguage } from "../unsupported-locale";

export const EvictionFreeFooterLanguageToggle: React.FC<{}> = () => {
  const { server } = useContext(AppContext);
  const unsupportedLocale = useEvictionFreeUnsupportedLocale();

  return (
    <div className="jf-language-toggle">
      <Trans>Language:</Trans>{" "}
      <ul>
        {server.enabledLocales.map((locale) => (
          <li key={locale}>
            <SwitchLanguage
              locale={locale}
              linkToCurrentLocale={!!unsupportedLocale}
            />
          </li>
        ))}
        {EvictionFreeUnsupportedLocaleChoices.map((locale) => (
          <li key={locale}>
            <SwitchToUnsupportedLanguage locale={locale} />
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
