import classnames from 'classnames';
import React, { useContext } from 'react';
import { Link, Route, useLocation } from 'react-router-dom';

import { Trans } from '@lingui/macro';
import loadable from '@loadable/component';

import { AppContext } from '../app-context';
import { createLinguiCatalogLoader } from '../i18n-lingui';
import { LoadingOverlayManager } from '../networking/loading-page';
import { NavbarLanguageDropdown } from '../ui/language-toggle';
import Navbar from '../ui/navbar';
import { LALetterBuilderFooter } from './components/footer';
import {
    getLALetterBuilderRoutesForPrimaryPages, LALetterBuilderRoutes as Routes
} from './route-info';
import { LALetterBuilderRouteComponent } from './routes';

import type { AppSiteProps } from "../app";

export const LALetterBuilderLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(
    () => import("../../../locales/en/laletterbuilder.chunk") as any
  ),
  es: loadable.lib(
    () => import("../../../locales/es/laletterbuilder.chunk") as any
  ),
});

function useIsPrimaryPage() {
  const location = useLocation();
  return getLALetterBuilderRoutesForPrimaryPages().includes(location.pathname);
}

const LALetterBuilderBrand: React.FC<{}> = () => {
  return (
    <Link className="navbar-item" to={Routes.locale.home}>
      <span className="jf-laletterbuilder-logo">LA Letter Builder</span>
    </Link>
  );
};

const LALetterBuilderMenuItems: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  return (
    <>
      <Link className="navbar-item" to={Routes.locale.letter.latestStep}>
        Build my letter
      </Link>
      {session.phoneNumber ? (
        <Link className="navbar-item" to={Routes.locale.logout}>
          <Trans>Log out</Trans>
        </Link>
      ) : (
        <Link className="navbar-item" to={Routes.locale.letter.phoneNumber}>
          <Trans>Log in</Trans>
        </Link>
      )}
      <NavbarLanguageDropdown />
    </>
  );
};

const LALetterBuilderSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    const isPrimaryPage = useIsPrimaryPage();

    return (
      <LALetterBuilderLinguiI18n>
        <section
          className={classnames(
            isPrimaryPage
              ? "jf-above-footer-content"
              : "jf-norent-internal-above-footer-content"
          )}
        >
          <span className={classnames(isPrimaryPage && "jf-white-navbar")}>
            <Navbar
              menuItemsComponent={LALetterBuilderMenuItems}
              brandComponent={LALetterBuilderBrand}
            />
          </span>
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
              <Route component={LALetterBuilderRouteComponent} />
            </LoadingOverlayManager>
          </div>
        </section>
        <LALetterBuilderFooter />
      </LALetterBuilderLinguiI18n>
    );
  }
);

export default LALetterBuilderSite;
