import React from "react";

import { HardshipDeclarationProps } from ".";
import i18n, { SupportedLocaleMap } from "../../i18n";
import English from "./en";

// TODO: Ideally we should lazy-load these.
const localizations: SupportedLocaleMap<React.ComponentType<
  HardshipDeclarationProps
>> = {
  en: English,
  // TODO: Replace this with actual Spanish component.
  es: English,
};

export const LocalizedHardshipDeclaration: React.FC<HardshipDeclarationProps> = (
  props
) => {
  const Component = localizations[i18n.locale];

  return <Component {...props} />;
};
