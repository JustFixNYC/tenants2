import { createRoutesForSite, ROUTE_PREFIX } from "../util/route-util";
import { createDevRouteInfo } from "../dev/route-info";
import { createEvictionFreeDeclarationBuilderRouteInfo } from "./declaration-builder/route-info";
import { createHtmlEmailStaticPageRouteInfo } from "../static-page/routes";
import {
  EvictionFreeUnsupportedLocaleChoices,
  EvictionFreeUnsupportedLocaleChoice,
  isEvictionFreeUnsupportedLocaleChoice,
} from "../../../common-data/evictionfree-unsupported-locale-choices";
import { useLocation } from "react-router-dom";

type UnsupportedLocaleRoutes = {
  [key in EvictionFreeUnsupportedLocaleChoice | "prefix"]: string;
};

function createUnsupportedLocaleRoutes(prefix: string) {
  const paths = {
    [ROUTE_PREFIX]: prefix,
  } as UnsupportedLocaleRoutes;

  EvictionFreeUnsupportedLocaleChoices.forEach((locale) => {
    paths[locale] = `${prefix}/${locale}`;
  });

  return paths;
}

export function useEvictionFreeUnsupportedLocale(): EvictionFreeUnsupportedLocaleChoice | null {
  const loc = useLocation().pathname;

  if (loc.startsWith(EvictionFreeRoutes.unsupportedLocale.prefix)) {
    const parts = loc.split("/");
    const lastPart = parts[parts.length - 1];
    if (isEvictionFreeUnsupportedLocaleChoice(lastPart)) {
      return lastPart;
    }
  }

  return null;
}

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The locale prefix, e.g. `/en`. */
    [ROUTE_PREFIX]: prefix,

    /** The home page. */
    home: `${prefix}/`,

    /** The about page. */
    about: `${prefix}/about`,

    /** The frequently asked questions (faqs) page. */
    faqs: `${prefix}/faqs`,

    /** The declaration builder. */
    declaration: createEvictionFreeDeclarationBuilderRouteInfo(
      `${prefix}/declaration`
    ),

    /** The login page. */
    login: `${prefix}/login`,

    /** The logout page. */
    logout: `${prefix}/logout`,

    oneOffEmail: createHtmlEmailStaticPageRouteInfo(`${prefix}/one-off-email`),

    /** The email to the user w/ a copy of the declaration. */
    declarationEmailToUser: createHtmlEmailStaticPageRouteInfo(
      `${prefix}/declaration-email-to-user`
    ),

    /** The email to the landlord w/ a copy of the declaration. */
    declarationEmailToLandlord: createHtmlEmailStaticPageRouteInfo(
      `${prefix}/declaration-email-to-landlord`
    ),

    /** The email to housing court w/ a copy of the declaration. */
    declarationEmailToHousingCourt: createHtmlEmailStaticPageRouteInfo(
      `${prefix}/declaration-email-to-housing-court`
    ),
  };
}

export const EvictionFreeRoutes = createRoutesForSite(
  createLocalizedRouteInfo,
  {
    /**
     * Example pages used in integration tests, and other
     * development-related pages.
     */
    dev: createDevRouteInfo("/dev"),

    unsupportedLocale: createUnsupportedLocaleRoutes(`/unsupported-locale`),
  }
);

export const getEvictionFreeJumpToTopOfPageRoutes = () => [
  EvictionFreeRoutes.locale.declaration.confirmation,
  ...getEvictionFreeRoutesForPrimaryPages(),
];

export const getEvictionFreeUnsuportedLocaleRoutes = () => {
  return EvictionFreeUnsupportedLocaleChoices.map(
    (localeChoice) => EvictionFreeRoutes.unsupportedLocale[localeChoice]
  );
};

export const getEvictionFreeRoutesForPrimaryPages = () => [
  EvictionFreeRoutes.locale.home,
  EvictionFreeRoutes.locale.about,
  EvictionFreeRoutes.locale.faqs,
  ...getEvictionFreeUnsuportedLocaleRoutes(),
];
