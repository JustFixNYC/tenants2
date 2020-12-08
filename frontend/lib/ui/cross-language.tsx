import React from "react";
import { Trans } from "@lingui/macro";
import i18n from "../i18n";

/**
 * Text for e.g. "Spanish translation" text. This is potentially
 * confusing for localizers so we need to add some comments for them!
 */
export const InYourLanguageTranslation: React.FC<{}> = () => (
  <Trans description="This is used when showing the translation of English content in the user's language. It should be localized to use the name of the language itself, e.g. 'Spanish translation'.">
    (Name of your language) translation
  </Trans>
);

/**
 * A React component that only renders its children if the user's
 * current locale is non-English.
 */
export const ForeignLanguageOnly: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const isForeignLanguage = i18n.locale !== "en";

  if (!isForeignLanguage) return null;

  return <>{props.children}</>;
};
