import loadable from "@loadable/component";
import React from "react";
import { useLocation } from "react-router-dom";

import { HardshipDeclarationProps } from ".";
import { getGlobalAppServerInfo } from "../../app-context";
import i18n, { SupportedLocaleMap } from "../../i18n";
import { DefaultLoadingSpinner } from "../../networking/query-loader";

/**
 * If the current URL's querystring includes this text and
 * we are in a development environment, always show our fallback
 * instead of the localized declaration, to make it easy
 * to style the fallback during development.
 */
const SHOW_FALLBACK_QS = "?fallback";

const fallback = <DefaultLoadingSpinner />;

const localizations: SupportedLocaleMap<React.ComponentType<
  HardshipDeclarationProps
>> = {
  en: loadable(() => import("./en"), {
    fallback,
  }),
  // TODO: Replace this with actual Spanish component.
  es: loadable(() => import("./en"), {
    fallback,
  }),
};

export const LocalizedHardshipDeclaration: React.FC<HardshipDeclarationProps> = (
  props
) => {
  const Component = localizations[i18n.locale];
  const { search } = useLocation();
  const showFallback =
    getGlobalAppServerInfo().debug && search.includes(SHOW_FALLBACK_QS);

  return showFallback ? fallback : <Component {...props} />;
};
