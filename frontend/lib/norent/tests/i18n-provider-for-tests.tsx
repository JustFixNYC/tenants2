import React from "react";
import { mergeIntoLinguiCatalog, li18n } from "../../i18n-lingui";
import { I18nProvider } from "@lingui/react";
import * as enCatalog from "../../../../locales/en/norent.chunk";

export const NorentI18nProviderForTests: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  mergeIntoLinguiCatalog("en", enCatalog);

  return (
    <I18nProvider language="en" i18n={li18n}>
      {props.children}
    </I18nProvider>
  );
};
