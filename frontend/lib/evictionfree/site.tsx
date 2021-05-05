import loadable from "@loadable/component";
import React, { useContext } from "react";
import Headroom from "react-headroom";
import { Link, Route, useLocation } from "react-router-dom";
import type { AppSiteProps } from "../app";
import { createLinguiCatalogLoader } from "../i18n-lingui";
import { LoadingOverlayManager } from "../networking/loading-page";
import { EvictionFreeRouteComponent } from "./routes";
import {
  EvictionFreeRoutes as Routes,
  getEvictionFreeRoutesForPrimaryPages,
  useEvictionFreeUnsupportedLocale,
} from "./route-info";
import Navbar, { NavbarDropdown } from "../ui/navbar";
import { AppContext } from "../app-context";
import { Trans } from "@lingui/macro";
import { LANGUAGE_NAMES, SwitchLanguage } from "../ui/language-toggle";
import classnames from "classnames";
import { EvictionFreeFooter } from "./components/footer";
import { EvictionFreeHelmet } from "./components/helmet";
import i18n from "../i18n";
import {
  EvictionFreeUnsupportedLocaleChoices,
  getEvictionFreeUnsupportedLocaleChoiceLabels,
} from "../../../common-data/evictionfree-unsupported-locale-choices";
import { SwitchToUnsupportedLanguage } from "./unsupported-locale";
import { WarningBanner } from "../ui/covid-banners";
import { OutboundLink } from "../ui/outbound-link";

export const EvictionFreeLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(
    () => import("../../../locales/en/evictionfree.chunk") as any
  ),
  es: loadable.lib(
    () => import("../../../locales/es/evictionfree.chunk") as any
  ),
});

function useIsPrimaryPage() {
  const location = useLocation();
  return getEvictionFreeRoutesForPrimaryPages().includes(location.pathname);
}

const EvictionFreeBrand: React.FC<{}> = () => {
  const isPrimaryPage = useIsPrimaryPage();
  return (
    <Link className="navbar-item" to={Routes.locale.home}>
      <span
        className={classnames(
          "jf-evictionfree-logo",
          isPrimaryPage ? "has-text-info" : "has-text-white"
        )}
      >
        Eviction
        <br />
        Free NY
      </span>
    </Link>
  );
};

export const EvictionFreeLanguageDropdown: React.FC<{}> = () => {
  const { server } = useContext(AppContext);
  const locales = server.enabledLocales;
  const activeLocale = i18n.locale;
  const unsupportedLocale = useEvictionFreeUnsupportedLocale();
  const languageName = unsupportedLocale
    ? getEvictionFreeUnsupportedLocaleChoiceLabels()[unsupportedLocale]
    : LANGUAGE_NAMES[activeLocale];

  return (
    <NavbarDropdown id="locale" label={languageName}>
      {locales
        .filter((locale) =>
          !unsupportedLocale ? locale !== activeLocale : true
        )
        .map((locale) => (
          <SwitchLanguage
            key={locale}
            locale={locale}
            linkToCurrentLocale={!!unsupportedLocale}
            className="navbar-item"
          />
        ))}
      {EvictionFreeUnsupportedLocaleChoices.filter(
        (locale) => locale !== unsupportedLocale
      ).map((locale) => (
        <SwitchToUnsupportedLanguage
          locale={locale}
          className="navbar-item"
          key={locale}
        />
      ))}
    </NavbarDropdown>
  );
};

/**
 * This banner serves as a notification for any Eviction Moratorium updated that relate specifically
 * to the Eviction Free NY tool.
 *
 * NOTE: Check out the `getRoutesWithMoratoriumBanner()` function in covid-banners.tsx
 * to see which routes this banner is enabled for.
 */
const EvictionFreeMoratoriumBanner = (props: { pathname?: string }) => (
  <WarningBanner pathname={props.pathname}>
    <>
      <Trans id="evictionfree.moratoriumBanner">
        <b>The Eviction Moratorium has been extended until August 31, 2021!</b>{" "}
        The courts haven't provided an updated Hardship Declaration form yet,
        but it is likely that forms submitted over the last few months will
        provide protection until the new August deadline. Check back here for
        updates in the next few days.
      </Trans>{" "}
      <OutboundLink href="https://www.nysenate.gov/legislation/bills/2021/A7175">
        <Trans>Learn more</Trans>
      </OutboundLink>
    </>
  </WarningBanner>
);

const EvictionFreeBuildMyDeclarationLink: React.FC<{}> = () => {
  const isPrimaryPage = useIsPrimaryPage();
  return (
    <>
      <div className="navbar-item is-hidden-touch">
        <Link
          className={classnames(
            "button",
            isPrimaryPage ? "is-primary" : "is-info is-inverted is-outlined"
          )}
          to={Routes.locale.declaration.latestStep}
        >
          <Trans>Fill out my form</Trans>
        </Link>
      </div>
      <Link
        className="navbar-item is-hidden-desktop"
        to={Routes.locale.declaration.latestStep}
      >
        <Trans>Fill out my form</Trans>
      </Link>
    </>
  );
};

const EvictionFreeMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  return (
    <>
      <Link className="navbar-item" to={Routes.locale.faqs}>
        <Trans>Faqs</Trans>
      </Link>
      <Link className="navbar-item" to={Routes.locale.about}>
        <Trans>About</Trans>
      </Link>
      {session.phoneNumber ? (
        <Link className="navbar-item" to={Routes.locale.logout}>
          <Trans>Log out</Trans>
        </Link>
      ) : (
        <Link className="navbar-item" to={Routes.locale.login}>
          <Trans>Log in</Trans>
        </Link>
      )}
      <EvictionFreeLanguageDropdown />
      <EvictionFreeBuildMyDeclarationLink />
    </>
  );
};

const EvictionFreeSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    const isPrimaryPage = useIsPrimaryPage();
    const pathname = useLocation().pathname;
    const isHomepage = pathname === Routes.locale.home;

    return (
      <EvictionFreeLinguiI18n>
        <section
          className={classnames(
            isPrimaryPage
              ? "jf-above-footer-content"
              : "jf-norent-internal-above-footer-content"
          )}
        >
          <span
            className={classnames(
              isPrimaryPage && "jf-white-navbar",
              isHomepage && "jf-evictionfree-homepage-navbar"
            )}
          >
            {/* NOTE: We wanted to originally wrap ALL page navbars in this <Headroom> component,
            but unfortunately we noticed that this library interacts strangely with our page transitions
            between declaration builder steps and messes up the animation, so we are only including it 
            on the primary pages for now. */}
            {isPrimaryPage ? (
              <Headroom>
                <Navbar
                  menuItemsComponent={EvictionFreeMenuItems}
                  brandComponent={EvictionFreeBrand}
                />
              </Headroom>
            ) : (
              <Navbar
                menuItemsComponent={EvictionFreeMenuItems}
                brandComponent={EvictionFreeBrand}
              />
            )}
            <EvictionFreeHelmet />
          </span>
          <EvictionFreeMoratoriumBanner pathname={pathname} />
          {!isPrimaryPage && (
            <div className="jf-block-of-color-in-background" />
          )}
          <div
            ref={ref}
            data-jf-is-noninteractive
            tabIndex={-1}
            className={classnames(
              !isPrimaryPage && "box jf-norent-builder-page"
            )}
          >
            <LoadingOverlayManager>
              <Route component={EvictionFreeRouteComponent} />
            </LoadingOverlayManager>
          </div>
        </section>
        <EvictionFreeFooter />
      </EvictionFreeLinguiI18n>
    );
  }
);

export default EvictionFreeSite;
