import { createRoutesForSite } from "../util/route-util";
import { createDevRouteInfo } from "../dev/routes";
import { createLetterStaticPageRouteInfo } from "../static-page/routes";
import { createNorentLetterBuilderRouteInfo } from "./letter-builder/routes";

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The home page. */
    home: `${prefix}/`,

    /** The FAQs page. */
    faqs: `${prefix}/faqs`,

    /** The About page. */
    about: `${prefix}/about`,

    /** The "About Your Letter" page explaining the letter building process in more detail. */
    aboutLetter: `${prefix}/the-letter`,

    /** The Logout page */
    logout: `${prefix}/logout`,

    /** The letter content for the user's own data (HTML and PDF versions). */
    letterContent: createLetterStaticPageRouteInfo(`${prefix}/letter`),

    /** The email to the user's landlord. */
    letterEmail: `${prefix}/letter-email.txt`,

    /** The email to the user w/ a copy of the letter. */
    letterEmailToUser: `${prefix}/letter-email-to-user.txt`,

    /** The sample letter content (HTML and PDF versions). */
    sampleLetterContent: createLetterStaticPageRouteInfo(
      `${prefix}/sample-letter`
    ),

    /** The letter builder. */
    letter: createNorentLetterBuilderRouteInfo(`${prefix}/letter`),
  };
}

export const NorentRoutes = createRoutesForSite(createLocalizedRouteInfo, {
  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: createDevRouteInfo("/dev"),
});

export const getNorentJumpToTopOfPageRoutes = () => [
  NorentRoutes.locale.letter.confirmation,
  ...getNorentRoutesForPrimaryPages(),
];

export const getNorentRoutesForPrimaryPages = () => [
  NorentRoutes.locale.home,
  NorentRoutes.locale.about,
  NorentRoutes.locale.faqs,
  NorentRoutes.locale.aboutLetter,
];
