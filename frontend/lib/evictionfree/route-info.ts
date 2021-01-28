import { createRoutesForSite, ROUTE_PREFIX } from "../util/route-util";
import { createDevRouteInfo } from "../dev/route-info";
import { createEvictionFreeDeclarationBuilderRouteInfo } from "./declaration-builder/route-info";
import { createHtmlEmailStaticPageRouteInfo } from "../static-page/routes";

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

    /** The logout page. */
    logout: `${prefix}/logout`,

    /** The email to the user w/ a copy of the declaration. */
    declarationEmailToUser: createHtmlEmailStaticPageRouteInfo(
      `${prefix}/declaration-email-to-user`
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
  }
);

export const getEvictionFreeJumpToTopOfPageRoutes = () => [
  EvictionFreeRoutes.locale.declaration.confirmation,
  ...getEvictionFreeRoutesForPrimaryPages(),
];

export const getEvictionFreeRoutesForPrimaryPages = () => [
  EvictionFreeRoutes.locale.home,
  EvictionFreeRoutes.locale.about,
  EvictionFreeRoutes.locale.faqs,
];
